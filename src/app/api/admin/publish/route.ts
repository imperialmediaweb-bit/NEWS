import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites as siteConfigs } from "@/config/sites";

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

    // Get or create sites
    const siteIds: { id: number; slug: string }[] = [];
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
        siteIds.push(upserted[0]);
      }
    }

    // Insert article for each site
    const results = [];
    for (const site of siteIds) {
      const { rows } = await pool.query(
        `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (site_id, slug) DO NOTHING
         RETURNING id`,
        [site.id, title, slug, content || "", summary || "", category || "general", author || "Staff Reporter", featured_image || ""]
      );
      results.push({ site: site.slug, inserted: rows.length > 0 });
    }

    return NextResponse.json({ success: true, results, sitesFound: siteIds.length, slug });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
