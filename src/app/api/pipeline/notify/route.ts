import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";
import {
  hasGoogleIndexingCredentials,
  submitGoogleIndexing,
  submitBingUrls,
  submitYandexRecrawl,
  refreshFacebookCache,
} from "@/lib/indexing";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/** Google's default Indexing API quota is 200 URLs per project per day. */
const GOOGLE_DAILY_QUOTA = 200;

/**
 * Submit recently published articles to ALL search engines:
 * 1. IndexNow → Bing, Yandex (instant)
 * 2. Google Ping → ping Google with sitemap URL
 * 3. Sitemap Ping → ping Bing with sitemap URL
 * 4. WebSub/PubSubHubbub → notify Google of RSS updates
 * 5. Google Indexing API → direct indexing request (if configured)
 * 6. Bing Webmaster URL submission → batch submit (if configured)
 * 7. Yandex recrawl + Facebook Open Graph refresh (if configured)
 */
export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPipelineEnabled())) {
    return NextResponse.json({ message: "Pipeline disabled" });
  }

  const startTime = Date.now();
  const runId = await logRunStart("indexnow");

  try {
    // Get articles published in the last 3 hours
    const { rows: articles } = await pool.query(
      `SELECT a.slug, a.category, s.domain
       FROM articles a
       JOIN sites s ON a.site_id = s.id
       WHERE a.auto_generated = true
       AND a.published_at > NOW() - INTERVAL '3 hours'
       LIMIT 500`
    );

    if (articles.length === 0) {
      await logRunEnd(runId, 0, 0, Date.now() - startTime);
      return NextResponse.json({ message: "No new articles to notify", count: 0 });
    }

    // Build URLs grouped by domain
    const urlsByDomain = new Map<string, string[]>();
    for (const article of articles) {
      const domain = article.domain;
      const url = `https://${domain}/${article.category}/${article.slug}`;
      if (!urlsByDomain.has(domain)) {
        urlsByDomain.set(domain, []);
      }
      urlsByDomain.get(domain)!.push(url);
    }

    let totalNotified = 0;
    let totalFailed = 0;
    const results: Record<string, unknown> = {};

    const entries = Array.from(urlsByDomain.entries());

    // ─── 1. IndexNow (Bing, Yandex) ───
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      let indexNowOk = 0;
      let indexNowFail = 0;
      for (const [domain, urls] of entries) {
        try {
          const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: domain,
              key: indexNowKey,
              urlList: urls.slice(0, 10000),
            }),
          });
          if (res.ok || res.status === 202) {
            indexNowOk += urls.length;
          } else {
            indexNowFail += urls.length;
          }
        } catch {
          indexNowFail += urls.length;
        }
      }
      totalNotified += indexNowOk;
      totalFailed += indexNowFail;
      results.indexNow = { ok: indexNowOk, failed: indexNowFail };
    }

    // ─── 2. Google Ping (sitemap) ───
    let googlePingOk = 0;
    let googlePingFail = 0;
    const pingedDomains = new Set<string>();
    for (const [domain] of entries) {
      if (pingedDomains.has(domain)) continue;
      pingedDomains.add(domain);
      try {
        const sitemapUrl = `https://${domain}/news-sitemap.xml`;
        const res = await fetch(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
          { method: "GET" }
        );
        if (res.ok) {
          googlePingOk++;
        } else {
          googlePingFail++;
        }
      } catch {
        googlePingFail++;
      }
    }
    results.googlePing = { ok: googlePingOk, failed: googlePingFail };

    // ─── 3. Bing Sitemap Ping ───
    let bingPingOk = 0;
    let bingPingFail = 0;
    const bingPingedDomains = new Set<string>();
    for (const [domain] of entries) {
      if (bingPingedDomains.has(domain)) continue;
      bingPingedDomains.add(domain);
      try {
        const sitemapUrl = `https://${domain}/news-sitemap.xml`;
        const res = await fetch(
          `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
          { method: "GET" }
        );
        if (res.ok) {
          bingPingOk++;
        } else {
          bingPingFail++;
        }
      } catch {
        bingPingFail++;
      }
    }
    results.bingPing = { ok: bingPingOk, failed: bingPingFail };

    // ─── 4. WebSub / PubSubHubbub (Google) ───
    let websubOk = 0;
    let websubFail = 0;
    const websubPingedDomains = new Set<string>();
    for (const [domain] of entries) {
      if (websubPingedDomains.has(domain)) continue;
      websubPingedDomains.add(domain);
      try {
        // Notify Google's PubSubHubbub hub about RSS feed updates
        const feedUrl = `https://${domain}/feed`;
        const res = await fetch("https://pubsubhubbub.appspot.com/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            "hub.mode": "publish",
            "hub.url": feedUrl,
          }).toString(),
        });
        if (res.ok || res.status === 204) {
          websubOk++;
        } else {
          websubFail++;
        }
        // Also ping with the news sitemap as an RSS-like feed
        const newsFeedUrl = `https://${domain}/feed/local-news`;
        await fetch("https://pubsubhubbub.appspot.com/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            "hub.mode": "publish",
            "hub.url": newsFeedUrl,
          }).toString(),
        }).catch(() => {});
      } catch {
        websubFail++;
      }
    }
    results.websub = { ok: websubOk, failed: websubFail };

    // ─── 5. Google Indexing API (requires service account) ───
    // The quota is ~200 URLs/day for the whole project, so spend it on the
    // newest articles rather than draining it on whichever domain sorts first.
    if (hasGoogleIndexingCredentials()) {
      let indexingOk = 0;
      let indexingFail = 0;
      const queue = interleaveByDomain(entries, GOOGLE_DAILY_QUOTA);
      for (const url of queue) {
        if (await submitGoogleIndexing(url)) {
          indexingOk++;
        } else {
          indexingFail++;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      results.googleIndexingApi = { ok: indexingOk, failed: indexingFail };
    }

    // ─── 6. Bing Webmaster URL submission (batch, per site) ───
    if (process.env.BING_WEBMASTER_API_KEY) {
      let bingOk = 0;
      let bingFail = 0;
      for (const [domain, urls] of entries) {
        if (await submitBingUrls(`https://${domain}`, urls)) {
          bingOk += Math.min(urls.length, 500);
        } else {
          bingFail += Math.min(urls.length, 500);
        }
      }
      results.bingWebmaster = { ok: bingOk, failed: bingFail };
    }

    // ─── 7. Yandex recrawl + Facebook Open Graph refresh ───
    // Both are per-URL and rate limited, so cap them the same way.
    if (process.env.YANDEX_WEBMASTER_TOKEN) {
      let yandexOk = 0;
      for (const url of interleaveByDomain(entries, 100)) {
        if (await submitYandexRecrawl(url)) yandexOk++;
      }
      results.yandex = { ok: yandexOk };
    }

    if (process.env.FACEBOOK_APP_ACCESS_TOKEN) {
      let fbOk = 0;
      for (const url of interleaveByDomain(entries, 100)) {
        if (await refreshFacebookCache(url)) fbOk++;
      }
      results.facebookCache = { ok: fbOk };
    }

    await logRunEnd(runId, totalNotified, totalFailed, Date.now() - startTime);

    return NextResponse.json({
      articles: articles.length,
      domains: urlsByDomain.size,
      results,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime, String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * Round-robin URLs across domains up to `limit`, so a 50-site network shares
 * a scarce daily quota evenly instead of one site consuming all of it.
 */
function interleaveByDomain(entries: [string, string[]][], limit: number): string[] {
  const out: string[] = [];
  const maxLen = Math.max(0, ...entries.map(([, urls]) => urls.length));
  for (let i = 0; i < maxLen && out.length < limit; i++) {
    for (const [, urls] of entries) {
      if (out.length >= limit) break;
      if (i < urls.length) out.push(urls[i]);
    }
  }
  return out;
}
