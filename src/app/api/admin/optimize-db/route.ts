import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Creates the indexes the hot queries actually need, and drops two redundant
 * ones on the highest-insert table. Idempotent — safe to run repeatedly.
 *
 * CONCURRENTLY keeps the tables writable while each index builds (important
 * on `articles`, which has ~730k rows).
 *
 * Call once: /api/admin/optimize-db?key=<CRON_SECRET>
 */

const STATEMENTS: { sql: string; why: string }[] = [
  // --- articles: the single most valuable index. Serves the homepage, all
  // four feeds, both sitemaps, web stories and the admin list.
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_site_published
          ON articles (site_id, published_at DESC)`,
    why: "homepage/feeds/sitemaps: site_id + published_at DESC",
  },
  // --- category listings, hub pages, related articles
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_site_cat_published
          ON articles (site_id, category, published_at DESC)`,
    why: "category pages, hub pages, related articles",
  },
  // --- web-stories AMP route looks up by slug WITHOUT site_id (full scan today)
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_slug
          ON articles (slug)`,
    why: "web-stories AMP slug-only lookup",
  },
  // --- /author/[name] filters on a FUNCTION of author, so only an
  // expression index can help. text_pattern_ops supports the LIKE 'x%' form.
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_author_expr
          ON articles (site_id, (lower(replace(author, '''', ''))) text_pattern_ops)`,
    why: "author pages (expression index for the LIKE lookup)",
  },
  // --- pipeline: dedup lookback + cleanup both scan feed_items by date
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_items_created
          ON feed_items (created_at)`,
    why: "dedup lookback + cleanup deletes",
  },
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_items_status_created
          ON feed_items (status, created_at)`,
    why: "rewrite claim query (status='pending' ORDER BY created_at)",
  },
  // --- facebook hourly quota check
  {
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fb_posts_page_status_time
          ON facebook_posts (page_id, status, posted_at DESC)`,
    why: "Facebook hourly quota check",
  },
  // --- page_views: drop write amplification on the highest-insert table.
  // idx_page_views_path is used by no query; idx_page_views_site_id is fully
  // covered by idx_page_views_site_created.
  {
    sql: `DROP INDEX CONCURRENTLY IF EXISTS idx_page_views_path`,
    why: "drop unused index (write amplification)",
  },
  {
    sql: `DROP INDEX CONCURRENTLY IF EXISTS idx_page_views_site_id`,
    why: "drop redundant index (covered by site_created)",
  },
];

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.CRON_SECRET;
  if (secret && key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { why: string; ok: boolean; error?: string; ms: number }[] = [];

  for (const stmt of STATEMENTS) {
    const started = Date.now();
    try {
      await pool.query(stmt.sql);
      results.push({ why: stmt.why, ok: true, ms: Date.now() - started });
    } catch (e) {
      results.push({
        why: stmt.why,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        ms: Date.now() - started,
      });
    }
  }

  // Reclaim planner stats after the index changes.
  try {
    await pool.query("ANALYZE articles");
    await pool.query("ANALYZE feed_items");
    await pool.query("ANALYZE page_views");
  } catch {
    // non-fatal
  }

  return NextResponse.json({
    applied: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
