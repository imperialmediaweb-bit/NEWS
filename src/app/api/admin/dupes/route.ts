import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * How much of the network is the same story on several sites: articles whose
 * source_url is shared by more than one site, by category, over the last N days.
 *   GET /api/admin/dupes?key=CRON_SECRET&days=30
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(365, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "30", 10) || 30));
  const { rows: byCat } = await pool.query(
    `WITH recent AS (
       SELECT id, site_id, category, source_url FROM articles
        WHERE published_at > now() - ($1 || ' days')::interval AND source_url IS NOT NULL AND source_url <> ''
     ), shared AS (
       SELECT source_url, count(DISTINCT site_id) AS sites FROM recent GROUP BY source_url
     )
     SELECT r.category,
            count(*)::int AS articles,
            count(*) FILTER (WHERE s.sites > 1)::int AS on_several_sites,
            round(avg(s.sites) FILTER (WHERE s.sites > 1), 1)::float AS avg_sites_when_shared,
            max(s.sites)::int AS max_sites
       FROM recent r JOIN shared s USING (source_url)
      GROUP BY r.category ORDER BY articles DESC`,
    [String(days)]
  );
  const { rows: top } = await pool.query(
    `SELECT source_url, count(DISTINCT site_id)::int AS sites, min(category) AS category
       FROM articles
      WHERE published_at > now() - ($1 || ' days')::interval AND source_url IS NOT NULL AND source_url <> ''
      GROUP BY source_url HAVING count(DISTINCT site_id) > 1
      ORDER BY 2 DESC LIMIT 10`,
    [String(days)]
  );
  const { rows: noSource } = await pool.query(
    `SELECT count(*)::int AS n FROM articles WHERE published_at > now() - ($1 || ' days')::interval AND (source_url IS NULL OR source_url = '')`,
    [String(days)]
  );
  return NextResponse.json({ days, byCategory: byCat, mostShared: top, withoutSource: noSource[0].n });
}
