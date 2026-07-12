import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites as siteConfigs } from "@/config/sites";

export const dynamic = "force-dynamic";

/**
 * Seeds ALL 50 sites from config into the `sites` table (idempotent upsert).
 * Guarantees the homepage /api/site and the AI pipeline can resolve every site.
 * Protected by CRON_SECRET. Call once: /api/admin/seed-sites?key=<CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.CRON_SECRET;
  if (secret && key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { slug: string; ok: boolean }[] = [];
  for (const cfg of Object.values(siteConfigs)) {
    try {
      await pool.query(
        `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE
           SET domain = EXCLUDED.domain,
               name = EXCLUDED.name,
               city = EXCLUDED.city,
               state = EXCLUDED.state,
               state_abbr = EXCLUDED.state_abbr,
               tagline = EXCLUDED.tagline`,
        [cfg.slug, cfg.domain, cfg.name, cfg.logoFirst, cfg.logoSecond,
         cfg.city, cfg.state, cfg.stateAbbr, cfg.tagline]
      );
      results.push({ slug: cfg.slug, ok: true });
    } catch (e) {
      console.error(`seed-sites ${cfg.slug} failed:`, e instanceof Error ? e.message : e);
      results.push({ slug: cfg.slug, ok: false });
    }
  }

  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM sites");
  const { rows: artRows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM articles");

  return NextResponse.json({
    seeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    total_sites_in_db: countRows[0]?.cnt ?? 0,
    total_articles_in_db: artRows[0]?.cnt ?? 0,
  });
}
