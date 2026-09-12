import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites as siteConfigs } from "@/config/sites";
import { notifySearchEnginesForMany, type EngineResult } from "@/lib/search-engines";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, summary, category, author, featured_image, sites: siteSlugs } = body;

    if (!title || !siteSlugs?.length) {
      return NextResponse.json({ error: "Title and sites required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const categorySlug = String(category || "local-news")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    // Get or create sites
    const siteIds: { id: number; slug: string; domain: string }[] = [];
    for (const siteSlug of siteSlugs) {
      const config = siteConfigs[siteSlug];
      if (!config) continue;

      // Upsert site - create if missing, return id either way
      const { rows: upserted } = await pool.query(
        `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [config.slug, config.domain, config.name, config.logoFirst, config.logoSecond,
         config.city, config.state, config.stateAbbr, config.tagline]
      );
      if (upserted.length > 0) {
        siteIds.push({ ...upserted[0], domain: config.domain });
      }
    }

    // Insert article for each site
    const results: { site: string; domain: string; url: string; inserted: boolean }[] = [];
    const urlsByDomain = new Map<string, string[]>();
    for (const site of siteIds) {
      const { rows } = await pool.query(
        `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (site_id, slug) DO NOTHING
         RETURNING id`,
        [site.id, title, slug, content || "", summary || "", categorySlug, author || "Staff Reporter", featured_image || ""]
      );
      const url = `https://${site.domain}/${categorySlug}/${slug}`;
      results.push({ site: site.slug, domain: site.domain, url, inserted: rows.length > 0 });
      urlsByDomain.set(site.domain, [url]);
    }

    // Tell the search engines right away — IndexNow (Bing/Yandex), Google
    // Indexing API when a service account is configured, WebSub for Google's
    // crawler. Failures here never fail the publish: the articles are saved.
    let indexing: Record<string, EngineResult> = {};
    try {
      indexing = await notifySearchEnginesForMany(urlsByDomain);
    } catch (e) {
      console.error("[publish] search engine notification failed:", e);
    }

    return NextResponse.json({
      success: true,
      results,
      links: results.map((r) => r.url),
      sitesFound: siteIds.length,
      slug,
      indexing: summarize(indexing),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function summarize(indexing: Record<string, EngineResult>) {
  const domains = Object.values(indexing);
  const indexNowOk = domains.filter((d) => d.indexNow === "ok").length;
  const websubOk = domains.filter((d) => d.websub === "ok").length;
  const googleConfigured = domains.some((d) => d.google !== "skipped");
  const googleOk = domains.reduce((n, d) => n + (d.google === "skipped" ? 0 : d.google.ok), 0);
  const googleFailed = domains.reduce((n, d) => n + (d.google === "skipped" ? 0 : d.google.failed), 0);
  return {
    domains: domains.length,
    indexNow: { ok: indexNowOk, failed: domains.length - indexNowOk },
    websub: { ok: websubOk, failed: domains.length - websubOk },
    google: googleConfigured ? { ok: googleOk, failed: googleFailed } : ("not configured" as const),
  };
}
