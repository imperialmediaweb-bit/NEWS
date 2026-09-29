import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Count what is in the archive, by the things that make an article worth
 * keeping or not. Counts only — this endpoint deletes nothing.
 *
 * The defabricate pass turned out not to work: shown a real attribution
 * ("Sunak's spokesperson stated...") and an invented one ("a spokesperson from
 * the Nevada High School Athletic Association stated...") it cannot tell them
 * apart, because from the text alone they are the same sentence. It stripped
 * "reportedly" from unsourced claims, making them more assertive, and removed
 * a genuine attribution from a real quote. Repair is not available for
 * articles whose source is gone.
 *
 * What is available is deciding which of them are worth keeping at all, and
 * that turns on things that can be counted:
 *
 *   duplicated   the same article on several domains — the Parthenon Marbles
 *                piece runs identically on wyoming-express, alabama-express
 *                and alaskaexpres. Fifty "local" sites carrying one story is
 *                the scaled-content pattern, whatever the story says.
 *   nonLocal     filed under world or us-news and never naming its own state.
 *                A Wyoming site has no reason to carry a UK-Greece dispute.
 *   old          published before the pipeline was producing anything checkable.
 *   noSource     no source_url, so it can never be verified or rebuilt.
 *
 * The buckets overlap heavily, so the combined figure is reported separately
 * rather than left to be added up wrongly.
 *
 *   GET /api/admin/archive-audit?key=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = req.nextUrl.searchParams.get("before") || "2025-01-01";

  try {
    const { rows: totals } = await pool.query(
      "SELECT count(*)::int AS total FROM articles"
    );

    // Same slug on more than one site. The slug is derived from the headline,
    // so this finds the same story syndicated across the network.
    const { rows: dup } = await pool.query(
      `SELECT coalesce(sum(n), 0)::int AS articles,
              count(*)::int AS stories
         FROM (
           SELECT count(*) AS n
             FROM articles
            GROUP BY slug
           HAVING count(DISTINCT site_id) > 1
         ) d`
    );

    const { rows: nonLocal } = await pool.query(
      `SELECT count(*)::int AS n
         FROM articles a
         JOIN sites s ON a.site_id = s.id
        WHERE a.category IN ('world', 'world-news', 'us-news', 'national')
          AND position(lower(s.state) in lower(coalesce(a.content, ''))) = 0`
    );

    const { rows: old } = await pool.query(
      "SELECT count(*)::int AS n FROM articles WHERE published_at < $1",
      [cutoff]
    );

    const { rows: noSource } = await pool.query(
      `SELECT count(*)::int AS n FROM articles
        WHERE source_url IS NULL OR source_url = ''`
    );

    // Anything matching at least one test — the figure that actually matters,
    // since most of these articles fail several at once.
    const { rows: combined } = await pool.query(
      `SELECT count(*)::int AS n
         FROM articles a
         JOIN sites s ON a.site_id = s.id
        WHERE a.published_at < $1
           OR a.source_url IS NULL OR a.source_url = ''
           OR (a.category IN ('world', 'world-news', 'us-news', 'national')
               AND position(lower(s.state) in lower(coalesce(a.content, ''))) = 0)
           OR a.slug IN (
                SELECT slug FROM articles
                 GROUP BY slug HAVING count(DISTINCT site_id) > 1
              )`,
      [cutoff]
    );

    const { rows: byYear } = await pool.query(
      `SELECT extract(year from published_at)::int AS year, count(*)::int AS n
         FROM articles
        GROUP BY 1 ORDER BY 1`
    );

    const { rows: byCategory } = await pool.query(
      `SELECT coalesce(category, '(none)') AS category, count(*)::int AS n
         FROM articles GROUP BY 1 ORDER BY n DESC LIMIT 15`
    );

    const total = Number(totals[0]?.total) || 0;
    const wouldDelete = Number(combined[0]?.n) || 0;

    return NextResponse.json({
      totalArticles: total,
      buckets: {
        duplicatedAcrossSites: {
          articles: Number(dup[0]?.articles) || 0,
          distinctStories: Number(dup[0]?.stories) || 0,
        },
        nonLocalWorldOrNational: Number(nonLocal[0]?.n) || 0,
        publishedBefore: { cutoff, count: Number(old[0]?.n) || 0 },
        withoutSourceUrl: Number(noSource[0]?.n) || 0,
      },
      matchingAtLeastOne: wouldDelete,
      wouldRemain: total - wouldDelete,
      percentageAffected: total > 0 ? Number(((wouldDelete / total) * 100).toFixed(1)) : 0,
      byYear,
      byCategory,
      note: "Counts only. Nothing has been deleted. The buckets overlap, so add nothing up — matchingAtLeastOne is the real figure.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
