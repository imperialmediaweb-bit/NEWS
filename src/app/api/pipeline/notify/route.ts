import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/**
 * Submit recently published articles to ALL search engines:
 * 1. IndexNow → Bing, Yandex (instant)
 * 2. Google Ping → ping Google with sitemap URL
 * 3. Sitemap Ping → ping Bing with sitemap URL
 * 4. WebSub/PubSubHubbub → notify Google of RSS updates
 * 5. Google Indexing API → direct indexing request (if configured)
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
    const googleSaKey = process.env.GOOGLE_INDEXING_SA_KEY;
    if (googleSaKey) {
      let indexingOk = 0;
      let indexingFail = 0;
      try {
        const token = await getGoogleAccessToken(googleSaKey);
        if (token) {
          // Google Indexing API allows batch of individual URLs
          for (const [, urls] of entries) {
            for (const url of urls.slice(0, 200)) {
              try {
                const res = await fetch(
                  "https://indexing.googleapis.com/v3/urlNotifications:publish",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      url,
                      type: "URL_UPDATED",
                    }),
                  }
                );
                if (res.ok) {
                  indexingOk++;
                } else {
                  indexingFail++;
                }
                // Rate limit: ~200 requests/day
                await new Promise((r) => setTimeout(r, 100));
              } catch {
                indexingFail++;
              }
            }
          }
        }
      } catch {
        indexingFail++;
      }
      results.googleIndexingApi = { ok: indexingOk, failed: indexingFail };
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
 * Get Google OAuth2 access token from service account JSON key.
 * Uses JWT grant type for server-to-server auth.
 */
async function getGoogleAccessToken(saKeyJson: string): Promise<string | null> {
  try {
    const key = JSON.parse(saKeyJson);
    const now = Math.floor(Date.now() / 1000);

    // Build JWT header and claim set
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = base64url(
      JSON.stringify({
        iss: key.client_email,
        scope: "https://www.googleapis.com/auth/indexing",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      })
    );

    // Sign with private key using Web Crypto
    const signingInput = `${header}.${claim}`;
    const pemKey = key.private_key;

    // Import PEM private key
    const pemContents = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    const jwt = `${signingInput}.${base64url(signature)}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      return data.access_token;
    }
    return null;
  } catch (e) {
    console.error("Google auth error:", e);
    return null;
  }
}

function base64url(input: string | ArrayBuffer): string {
  let str: string;
  if (typeof input === "string") {
    str = btoa(input);
  } else {
    const bytes = new Uint8Array(input);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    str = btoa(binary);
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
