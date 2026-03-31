import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import pool from "@/lib/db";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Submit all 50 site sitemaps to search engines.
 *
 * Methods:
 * 1. IndexNow — Bing, Yandex, Seznam, Naver (instant indexing)
 * 2. WebSub/PubSubHubbub — notify hub of feed updates
 * 3. Google Search Console API — submit sitemap.xml + news-sitemap.xml
 *
 * POST — start submission (fire-and-forget)
 * GET  — check results
 */

const INDEXNOW_KEY = "b7d8e9f2a1c4d6e8f0a2b4c6d8e0f2a4";

async function getGSCToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) return null;

  try {
    return await getGoogleAccessToken(
      email,
      key,
      "https://www.googleapis.com/auth/webmasters"
    );
  } catch (err) {
    console.error("[sitemap-submit] Failed to get GSC token:", err);
    return null;
  }
}

async function submitToGSC(
  token: string,
  domain: string,
  sitemapUrl: string
): Promise<string> {
  try {
    const siteUrl = encodeURIComponent(`https://${domain}/`);
    const feedpath = encodeURIComponent(sitemapUrl);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps/${feedpath}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok || res.status === 204) return "OK";
    const body = await res.text();
    return `FAILED (${res.status}): ${body.slice(0, 120)}`;
  } catch (err) {
    return `ERROR: ${String(err).slice(0, 80)}`;
  }
}

async function submitSitemaps() {
  const results: {
    domain: string;
    indexnow: string;
    websub: string;
    gsc_sitemap: string;
    gsc_news: string;
  }[] = [];

  // Get Google Search Console token once for all sites
  const gscToken = await getGSCToken();
  if (!gscToken) {
    console.log("[sitemap-submit] No GSC credentials configured, skipping GSC submission");
  } else {
    console.log("[sitemap-submit] GSC token obtained, will submit sitemaps to Search Console");
  }

  for (const site of Object.values(sites)) {
    const domain = site.domain;
    let indexnowStatus = "OK";
    let websubStatus = "OK";
    let gscSitemapStatus = "SKIPPED";
    let gscNewsStatus = "SKIPPED";

    // 1. IndexNow — submit sitemap URL to Bing/Yandex
    try {
      const indexnowRes = await fetch(
        `https://api.indexnow.org/indexnow?url=${encodeURIComponent(`https://${domain}/sitemap.xml`)}&key=${INDEXNOW_KEY}`,
        { method: "GET" }
      );
      if (!indexnowRes.ok && indexnowRes.status !== 202) {
        indexnowStatus = `FAILED (${indexnowRes.status})`;
      }
    } catch (err) {
      indexnowStatus = `ERROR: ${String(err).slice(0, 80)}`;
    }

    // 2. WebSub — notify Google's hub about feed updates
    try {
      const feedUrl = `https://${domain}/feed`;
      const hubRes = await fetch("https://pubsubhubbub.appspot.com/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `hub.mode=publish&hub.url=${encodeURIComponent(feedUrl)}`,
      });
      if (!hubRes.ok) {
        websubStatus = `FAILED (${hubRes.status})`;
      }
    } catch (err) {
      websubStatus = `ERROR: ${String(err).slice(0, 80)}`;
    }

    // 3. Google Search Console API — submit sitemap.xml + news-sitemap.xml
    if (gscToken) {
      gscSitemapStatus = await submitToGSC(
        gscToken,
        domain,
        `https://${domain}/sitemap.xml`
      );
      gscNewsStatus = await submitToGSC(
        gscToken,
        domain,
        `https://${domain}/news-sitemap.xml`
      );
    }

    results.push({
      domain,
      indexnow: indexnowStatus,
      websub: websubStatus,
      gsc_sitemap: gscSitemapStatus,
      gsc_news: gscNewsStatus,
    });

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 150));
  }

  const indexnowOk = results.filter((r) => r.indexnow === "OK").length;
  const websubOk = results.filter((r) => r.websub === "OK").length;
  const gscSitemapOk = results.filter((r) => r.gsc_sitemap === "OK").length;
  const gscNewsOk = results.filter((r) => r.gsc_news === "OK").length;

  const summary = {
    total: results.length,
    indexnowOk,
    websubOk,
    gscSitemapOk,
    gscNewsOk,
    gscConfigured: !!gscToken,
    results,
    completedAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO pipeline_config (key, value) VALUES ('sitemap_submit_results', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(summary)]
  );

  console.log(
    `[sitemap-submit] Done: IndexNow ${indexnowOk}/50, WebSub ${websubOk}/50, GSC Sitemap ${gscSitemapOk}/50, GSC News ${gscNewsOk}/50`
  );
}

export async function POST(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("admin_token")?.value;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  submitSitemaps().catch((err) => console.error("[sitemap-submit] Error:", err));

  return NextResponse.json({
    message:
      "Submitting to IndexNow + WebSub + Google Search Console. Check GET for results in 2-3 minutes.",
  });
}

export async function GET(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("admin_token")?.value;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT value FROM pipeline_config WHERE key = 'sitemap_submit_results'"
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: "No results yet. Run POST first." });
    }
    return NextResponse.json(JSON.parse(rows[0].value));
  } catch {
    return NextResponse.json({ message: "No results yet." });
  }
}
