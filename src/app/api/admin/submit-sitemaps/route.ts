import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import pool from "@/lib/db";

/**
 * Submit all 50 site sitemaps to Google & Bing.
 * Uses ping endpoints — no API key needed.
 *
 * POST — start submission (fire-and-forget)
 * GET  — check results
 */

async function submitSitemaps() {
  const results: { domain: string; google: string; bing: string }[] = [];

  for (const site of Object.values(sites)) {
    const domain = site.domain;
    const sitemapUrl = `https://${domain}/sitemap.xml`;
    const newsSitemapUrl = `https://${domain}/news-sitemap.xml`;

    let googleStatus = "OK";
    let bingStatus = "OK";

    try {
      // Google Ping — sitemap.xml
      const g1 = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: "GET" }
      );
      // Google Ping — news-sitemap.xml
      const g2 = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(newsSitemapUrl)}`,
        { method: "GET" }
      );
      if (!g1.ok && !g2.ok) googleStatus = `FAILED (${g1.status})`;
    } catch (err) {
      googleStatus = `ERROR: ${String(err).slice(0, 100)}`;
    }

    try {
      // Bing Ping — sitemap.xml
      const b1 = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { method: "GET" }
      );
      // Bing Ping — news-sitemap.xml
      const b2 = await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(newsSitemapUrl)}`,
        { method: "GET" }
      );
      if (!b1.ok && !b2.ok) bingStatus = `FAILED (${b1.status})`;
    } catch (err) {
      bingStatus = `ERROR: ${String(err).slice(0, 100)}`;
    }

    results.push({ domain, google: googleStatus, bing: bingStatus });

    // Small delay to not spam
    await new Promise((r) => setTimeout(r, 200));
  }

  const googleOk = results.filter((r) => r.google === "OK").length;
  const bingOk = results.filter((r) => r.bing === "OK").length;

  const summary = {
    total: results.length,
    googleOk,
    bingOk,
    results,
    completedAt: new Date().toISOString(),
  };

  // Save results to DB
  await pool.query(
    `INSERT INTO pipeline_config (key, value) VALUES ('sitemap_submit_results', $1)
     ON CONFLICT (key) DO UPDATE SET value = $1`,
    [JSON.stringify(summary)]
  );

  console.log(`[sitemap-submit] Done: Google ${googleOk}/50, Bing ${bingOk}/50`);
}

export async function POST(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("admin_token")?.value;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire and forget
  submitSitemaps().catch((err) => console.error("[sitemap-submit] Error:", err));

  return NextResponse.json({
    message: "Submitting sitemaps to Google & Bing. Check GET for results in 1-2 minutes.",
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
