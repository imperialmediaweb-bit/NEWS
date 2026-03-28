import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";

export async function POST(request: NextRequest) {
  try {
    const { siteSlug, articles } = await request.json();

    if (!siteSlug || !articles?.length) {
      return NextResponse.json({ error: "siteSlug and articles required" }, { status: 400 });
    }

    const siteConfig = sites[siteSlug];
    if (!siteConfig) {
      return NextResponse.json({ error: "Site not found" }, { status: 400 });
    }

    // Get or create site
    let siteId: number;
    const { rows: existing } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (existing.length > 0) {
      siteId = existing[0].id;
    } else {
      const { rows: inserted } = await pool.query(
        `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [siteConfig.slug, siteConfig.domain, siteConfig.name, siteConfig.logoFirst, siteConfig.logoSecond,
         siteConfig.city, siteConfig.state, siteConfig.stateAbbr, siteConfig.tagline]
      );
      siteId = inserted[0].id;
    }

    // Save articles
    let imported = 0;
    let skipped = 0;

    for (const art of articles) {
      try {
        const { rowCount } = await pool.query(
          `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, wp_original_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, art.title, art.slug, art.content, art.summary, art.category, art.author, art.featured_image, art.published_at, art.wp_id]
        );
        if ((rowCount ?? 0) > 0) imported++;
        else skipped++;
      } catch {
        skipped++;
      }
    }

    // Save categories
    const cats = Array.from(new Set(articles.map((a: Record<string, string>) => a.category).filter(Boolean))) as string[];
    for (const cat of cats) {
      const catSlug = String(cat).toLowerCase().replace(/\s+/g, "-");
      await pool.query(
        `INSERT INTO categories (site_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (site_id, slug) DO NOTHING`,
        [siteId, cat, catSlug]
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
