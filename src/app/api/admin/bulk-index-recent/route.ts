import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sites } from "@/config/sites";
import {
  submitGoogleIndexing,
  submitBingUrls,
  submitYandexRecrawl,
  refreshFacebookCache,
  hasGoogleIndexingCredentials,
} from "@/lib/indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Back-fill indexing for articles published in the last N days, across all 50
 * sites (or one named site).
 *
 *   GET /api/admin/bulk-index-recent?key=CRON_SECRET&days=7&limit=100
 *
 *   days     how far back to look (default 3, max 30)
 *   limit    max articles per site (default 50, max 500)
 *   site     optional single site slug, otherwise every site
 *   engines  comma list of google,bing,yandex,facebook (default all configured)
 *
 * Google's Indexing API allows ~200 URLs/day for the whole service account, so
 * that budget is shared round-robin across sites rather than being drained by
 * whichever site is processed first. Bing takes batches of 500 per site, so it
 * gets one call per site instead of one per URL.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const days = clamp(parseInt(params.get("days") || "3", 10), 1, 30);
  const perSiteLimit = clamp(parseInt(params.get("limit") || "50", 10), 1, 500);
  const googleBudget = clamp(parseInt(params.get("googleBudget") || "200", 10), 0, 200);
  const onlySlug = params.get("site");

  const enginesParam = params.get("engines");
  const wanted = enginesParam
    ? new Set(enginesParam.split(",").map((e) => e.trim().toLowerCase()))
    : null;
  const want = (name: string) => (wanted ? wanted.has(name) : true);

  const targets = onlySlug
    ? Object.values(sites).filter((s) => s.slug === onlySlug)
    : Object.values(sites);

  if (targets.length === 0) {
    return NextResponse.json({ error: `Unknown site: ${onlySlug}` }, { status: 400 });
  }

  const startedAt = Date.now();

  // ─── Collect the URLs first, so the Google budget can be split fairly ───
  const perSite: { slug: string; domain: string; urls: string[] }[] = [];
  for (const site of targets) {
    const { rows } = await query(
      `SELECT a.slug, a.category
         FROM articles a
         JOIN sites s ON a.site_id = s.id
        WHERE s.slug = $1
          AND a.published_at > NOW() - ($2 || ' days')::interval
        ORDER BY a.published_at DESC
        LIMIT $3`,
      [site.slug, String(days), perSiteLimit]
    );
    const urls = rows.map(
      (r: { slug: string; category: string | null }) =>
        `https://${site.domain}/${r.category || "local-news"}/${r.slug}`
    );
    if (urls.length > 0) {
      perSite.push({ slug: site.slug, domain: site.domain, urls });
    }
  }

  const totalUrls = perSite.reduce((n, s) => n + s.urls.length, 0);
  const results: Record<string, unknown> = {};

  // ─── Bing: one batched call per site ───
  if (want("bing") && process.env.BING_WEBMASTER_API_KEY) {
    let ok = 0;
    let failed = 0;
    for (const site of perSite) {
      if (await submitBingUrls(`https://${site.domain}`, site.urls)) {
        ok += Math.min(site.urls.length, 500);
      } else {
        failed += Math.min(site.urls.length, 500);
      }
    }
    results.bing = { submitted: ok, failed };
  }

  // ─── Google: round-robin across sites, capped at the daily quota ───
  if (want("google") && hasGoogleIndexingCredentials()) {
    const queue = roundRobin(perSite.map((s) => s.urls), googleBudget);
    let ok = 0;
    let failed = 0;
    for (const url of queue) {
      if (await submitGoogleIndexing(url)) ok++;
      else failed++;
      await sleep(100);
    }
    results.google = { submitted: ok, failed, quotaUsed: queue.length };
  }

  // ─── Yandex and Facebook: per-URL, same fair-share treatment ───
  if (want("yandex") && process.env.YANDEX_WEBMASTER_TOKEN) {
    const queue = roundRobin(perSite.map((s) => s.urls), 500);
    let ok = 0;
    for (const url of queue) if (await submitYandexRecrawl(url)) ok++;
    results.yandex = { submitted: ok, attempted: queue.length };
  }

  if (want("facebook") && process.env.FACEBOOK_APP_ACCESS_TOKEN) {
    const queue = roundRobin(perSite.map((s) => s.urls), 500);
    let ok = 0;
    for (const url of queue) if (await refreshFacebookCache(url)) ok++;
    results.facebook = { refreshed: ok, attempted: queue.length };
  }

  return NextResponse.json({
    days,
    sites: perSite.length,
    totalUrls,
    results,
    durationMs: Date.now() - startedAt,
  });
}

function roundRobin(lists: string[][], limit: number): string[] {
  const out: string[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < maxLen && out.length < limit; i++) {
    for (const list of lists) {
      if (out.length >= limit) break;
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
