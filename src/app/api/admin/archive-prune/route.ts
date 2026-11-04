import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Remove old articles nobody reads.
 *
 *   GET /api/admin/archive-prune?key=…&olderThanDays=365
 *       → what would go and what it is worth. Deletes nothing.
 *   GET /api/admin/archive-prune?key=…&olderThanDays=365&confirm=prune-archive&limit=5000
 *       → deletes up to `limit`, repeat until remaining is 0.
 *
 * Why this exists: the archive is 713,000 articles, 85% of them from 2024
 * and earlier, and it is what the database bill is made of — 5 GB on disk,
 * a 2.2 GB working set, a backup of both. Search Console shows the whole
 * network earning 44 clicks in 28 days. The old rows cost money every month
 * and bring in nothing measurable.
 *
 * What it will NOT delete, and this is the whole design:
 *
 * An article anyone has opened in the last 60 days stays, however old. Page
 * views are recorded by path, so each candidate is joined to its own URL in
 * page_views. "Old" is not the criterion — "old and unread" is. An article
 * from 2024 that still gets a visitor a week is the kind of page an archive
 * is for.
 *
 * Every removed row is recorded in pruned_articles — title, URL, date, source
 * — inside the same transaction. A deletion this size without a record is a
 * disappearance. The body is not kept: Railway's own database backups hold
 * it for the backup window, which is the real safety net here.
 */

const CONFIRM = "prune-archive";
// The cleanup job keeps page_views for 60 days; a longer window would be a
// claim the data cannot back.
const RECENT_VIEW_DAYS = 60;

async function ensureLog() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pruned_articles (
      id SERIAL PRIMARY KEY,
      article_id INTEGER NOT NULL,
      domain VARCHAR(255),
      slug VARCHAR(500),
      category VARCHAR(100),
      title VARCHAR(500),
      published_at TIMESTAMP,
      source_url VARCHAR(1000),
      reason VARCHAR(200) NOT NULL,
      pruned_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const olderThanDays = Math.max(
    30,
    parseInt(req.nextUrl.searchParams.get("olderThanDays") || "365", 10) || 365
  );
  const confirm = req.nextUrl.searchParams.get("confirm");

  // Deleting rows marks their space reusable; it does not give it back to the
  // disk. The volume (and its bill) only shrinks when the table file is
  // rewritten, which is what VACUUM FULL does. It takes an exclusive lock on
  // the table for the duration, so it is a separate, deliberate step.
  if (req.nextUrl.searchParams.get("action") === "vacuum") {
    // Only tables the daily cleanup deletes from; the name goes into SQL, so
    // it is matched against this list, never taken from the request as-is.
    const VACUUMABLE = ["articles", "page_views", "feed_items", "facebook_posts"];
    const table = VACUUMABLE.find((t) => t === req.nextUrl.searchParams.get("table")) || "articles";
    const before = await pool.query(
      `SELECT pg_size_pretty(pg_total_relation_size('${table}')) AS table_size,
              pg_size_pretty(pg_database_size(current_database())) AS database`
    );
    const started = Date.now();
    const client = await pool.connect();
    try {
      await client.query("SET statement_timeout = 0");
      await client.query(`VACUUM FULL ANALYZE ${table}`);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : String(e), before: before.rows[0] },
        { status: 500 }
      );
    } finally {
      client.release();
    }
    const after = await pool.query(
      `SELECT pg_size_pretty(pg_total_relation_size('${table}')) AS table_size,
              pg_size_pretty(pg_database_size(current_database())) AS database`
    );
    return NextResponse.json({
      vacuumed: table,
      seconds: Math.round((Date.now() - started) / 1000),
      before: before.rows[0],
      after: after.rows[0],
    });
  }
  const limit = Math.min(
    10000,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "5000", 10) || 5000)
  );

  // Candidates: older than the cutoff, with no view on their own URL in the
  // last 90 days. The path page_views stores is "/<category>/<slug>".
  const candidateWhere = `
    a.published_at < NOW() - make_interval(days => $1)
    AND NOT EXISTS (
      SELECT 1 FROM page_views v
       WHERE v.site_id = a.site_id
         AND v.path = '/' || COALESCE(a.category, 'local-news') || '/' || a.slug
         AND v.created_at >= NOW() - INTERVAL '${RECENT_VIEW_DAYS} days'
    )`;

  if (confirm !== CONFIRM) {
    const [{ rows: total }, { rows: old }, { rows: cand }, { rows: size }, { rows: byYear }] =
      await Promise.all([
        pool.query("SELECT count(*)::int AS n FROM articles"),
        pool.query(
          "SELECT count(*)::int AS n FROM articles a WHERE a.published_at < NOW() - make_interval(days => $1)",
          [olderThanDays]
        ),
        pool.query(`SELECT count(*)::int AS n FROM articles a WHERE ${candidateWhere}`, [
          olderThanDays,
        ]),
        pool.query(
          `SELECT pg_size_pretty(pg_total_relation_size('articles')) AS articles_table,
                  pg_size_pretty(pg_database_size(current_database())) AS database,
                  pg_size_pretty((SELECT sum(size) FROM pg_ls_waldir())) AS wal,
                  (SELECT string_agg(datname || ' ' || pg_size_pretty(pg_database_size(datname)), ', ')
                     FROM pg_database) AS all_databases,
                  (SELECT string_agg(relname || ' ' || pg_size_pretty(pg_total_relation_size(oid)), ', ')
                     FROM (SELECT oid, relname FROM pg_class WHERE relkind = 'r'
                             AND relnamespace = 'public'::regnamespace
                            ORDER BY pg_total_relation_size(oid) DESC LIMIT 8) t) AS largest_tables`
        ),
        pool.query(
          `SELECT extract(year FROM a.published_at)::int AS year, count(*)::int AS n
             FROM articles a WHERE ${candidateWhere}
            GROUP BY 1 ORDER BY 1`,
          [olderThanDays]
        ),
      ]);

    const oldN = Number(old[0]?.n) || 0;
    const candN = Number(cand[0]?.n) || 0;

    return NextResponse.json({
      dryRun: true,
      olderThanDays,
      totalArticles: Number(total[0]?.n) || 0,
      olderThanCutoff: oldN,
      // The gap between these two is the point: old articles that someone
      // has opened recently, which stay.
      oldButStillRead: oldN - candN,
      wouldDelete: candN,
      wouldDeleteByYear: byYear,
      sizeNow: size[0],
      note: `Nothing was deleted. "Still read" means at least one visit to the article's own URL in the last ${RECENT_VIEW_DAYS} days; those stay whatever their age.`,
      toDelete: `add &confirm=${CONFIRM}&limit=${limit} and repeat until remaining is 0`,
    });
  }

  await ensureLog();

  const client = await pool.connect();
  let deleted = 0;
  try {
    await client.query("BEGIN");
    const { rows: batch } = await client.query(
      `SELECT a.id
         FROM articles a
        WHERE ${candidateWhere}
        ORDER BY a.published_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED`,
      [olderThanDays, limit]
    );

    if (batch.length > 0) {
      // One array parameter, whatever the batch size: a VALUES list of
      // 10,000 rows is 80,000 parameters and Postgres binds at most 65,535.
      const ids = batch.map((r) => Number(r.id));
      await client.query(
        `INSERT INTO pruned_articles
           (article_id, domain, slug, category, title, published_at, source_url, reason)
         SELECT a.id, s.domain, a.slug, a.category, a.title, a.published_at, a.source_url, $2
           FROM articles a LEFT JOIN sites s ON a.site_id = s.id
          WHERE a.id = ANY($1::int[])`,
        [ids, `older than ${olderThanDays}d, no visit in ${RECENT_VIEW_DAYS}d`]
      );
      const res = await client.query(`DELETE FROM articles WHERE id = ANY($1::int[])`, [ids]);
      deleted = res.rowCount || 0;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), deleted: 0 },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  // A full batch proves there is more; counting the rest every call is a
  // full scan the request does not have time for.
  const fullBatch = deleted >= limit;
  const { rows: logged } = await pool.query("SELECT count(*)::int AS n FROM pruned_articles");
  let remaining: number | string = "more (batch came back full)";
  if (!fullBatch) {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM articles a WHERE ${candidateWhere}`,
      [olderThanDays]
    );
    remaining = Number(rows[0]?.n) || 0;
  }

  return NextResponse.json({
    deleted,
    recorded: Number(logged[0]?.n) || 0,
    remaining,
    done: remaining === 0,
    // Deleted rows do not shrink the file until VACUUM runs; the optimize_db
    // job does that on its daily pass. The size on disk moves after it, not
    // after this.
    next: remaining !== 0 ? `same URL again` : "run optimize_db, then check sizeNow",
  });
}
