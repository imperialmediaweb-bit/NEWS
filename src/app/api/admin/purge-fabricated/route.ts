import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Delete the articles this pipeline wrote with invented attribution.
 *
 * The old rewriter prompt instructed the model to manufacture sourcing:
 *
 *   Instead use GENERIC official sources: "according to officials",
 *   "authorities confirmed", "sources familiar with the matter said" ...
 *   Include 2-3 natural attributions in the body to sound credible
 *
 * So the phrases are not a rare failure, they are the house style, and
 * 62,778 generated articles carry at least one. They cannot be corrected:
 * defabricate was written to strip the phrases and proved actively harmful —
 * it removed "reportedly" from unsourced claims, making them read as
 * established fact, and deleted a genuine attribution to a named
 * spokesperson. And rewriting from source needs a reachable source, which
 * most of these do not have: their source_url is a Google News token that no
 * longer resolves to a publisher.
 *
 * That leaves removal.
 *
 *   GET /api/admin/purge-fabricated?key=CRON_SECRET
 *       → counts and sample titles, deletes nothing
 *   GET /api/admin/purge-fabricated?key=CRON_SECRET&confirm=delete-fabricated&limit=2000
 *       → deletes up to `limit`, repeat until remaining is 0
 *
 * Two things this will not do, both deliberate:
 *
 * It never touches an article with a wp_original_id. Those 10,236 matches are
 * imported from WordPress sites that already existed — somebody's actual
 * reporting, where "a spokesperson said" is ordinary journalism. Reading the
 * 73,014 matches as one number once produced a recommendation to delete most
 * of the archive, and that was wrong. The exclusion is hard-coded rather than
 * a parameter so it cannot be switched off by a careless URL.
 *
 * And it records every row it removes in purged_articles first. A deletion of
 * this size without a record is not a deletion, it is a disappearance: if
 * someone writes next year asking what happened to a page about them, or
 * whether an article existed at all, the answer has to be available. The
 * record keeps the title, URL and publication date, not the fabricated body.
 */

const PATTERNS = [
  "%sources familiar%",
  "%spokesperson%",
  "%officials confirmed%",
  "%authorities confirmed%",
  "%according to officials%",
  "%records show%",
  "%data indicates%",
  "%court documents reveal%",
  "%investigators reported%",
  "%studies show%",
];

const CONFIRM = "delete-fabricated";

async function ensurePurgeLog() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purged_articles (
      id SERIAL PRIMARY KEY,
      article_id INTEGER NOT NULL,
      domain VARCHAR(255),
      slug VARCHAR(500),
      category VARCHAR(100),
      title VARCHAR(500),
      published_at TIMESTAMP,
      source_url VARCHAR(1000),
      reason VARCHAR(200) NOT NULL,
      purged_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_purged_slug ON purged_articles (slug)"
  );
}

export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const confirm = req.nextUrl.searchParams.get("confirm");
  const limit = Math.min(
    5000,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "1000", 10) || 1000)
  );

  const where = `a.wp_original_id IS NULL AND (${PATTERNS.map(
    (_, i) => `a.content ILIKE $${i + 1}`
  ).join(" OR ")})`;

  if (confirm !== CONFIRM) {
    const [{ rows: counts }, { rows: sample }, { rows: safe }] = await Promise.all([
      pool.query(`SELECT count(*)::int AS n FROM articles a WHERE ${where}`, PATTERNS),
      pool.query(
        `SELECT a.title, a.slug, s.domain, a.published_at
           FROM articles a JOIN sites s ON a.site_id = s.id
          WHERE ${where}
          ORDER BY a.id
          LIMIT 5`,
        PATTERNS
      ),
      pool.query(
        `SELECT count(*)::int AS n FROM articles a
          WHERE a.wp_original_id IS NOT NULL
            AND (${PATTERNS.map((_, i) => `a.content ILIKE $${i + 1}`).join(" OR ")})`,
        PATTERNS
      ),
    ]);

    return NextResponse.json({
      dryRun: true,
      wouldDelete: Number(counts[0]?.n) || 0,
      protectedImported: Number(safe[0]?.n) || 0,
      note:
        "Nothing was deleted. protectedImported are WordPress imports — real reporting that uses the same phrases — and are never touched.",
      sample: sample.map((r) => ({
        title: r.title,
        url: `https://${r.domain}/${r.slug}`,
        publishedAt: r.published_at,
      })),
      toDelete: `add &confirm=${CONFIRM}&limit=2000 and repeat until remaining is 0`,
    });
  }

  await ensurePurgeLog();

  // Record first, then delete, in one transaction. The other order loses the
  // record if the delete fails halfway, which on 62,778 rows across many
  // calls is not a hypothetical.
  const client = await pool.connect();
  let deleted = 0;
  try {
    await client.query("BEGIN");

    const { rows: batch } = await client.query(
      `SELECT a.id, a.title, a.slug, a.category, a.published_at, a.source_url, s.domain
         FROM articles a JOIN sites s ON a.site_id = s.id
        WHERE ${where}
        ORDER BY a.id
        LIMIT $${PATTERNS.length + 1}
        FOR UPDATE OF a SKIP LOCKED`,
      [...PATTERNS, limit]
    );

    if (batch.length > 0) {
      const values: unknown[] = [];
      const tuples = batch.map((r, i) => {
        const b = i * 8;
        values.push(
          r.id,
          r.domain,
          r.slug,
          r.category,
          r.title,
          r.published_at,
          r.source_url,
          "invented attribution (pipeline-generated)"
        );
        return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`;
      });

      await client.query(
        `INSERT INTO purged_articles
           (article_id, domain, slug, category, title, published_at, source_url, reason)
         VALUES ${tuples.join(",")}`,
        values
      );

      const res = await client.query(
        `DELETE FROM articles WHERE id = ANY($1::int[])`,
        [batch.map((r) => r.id)]
      );
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

  const { rows: left } = await pool.query(
    `SELECT count(*)::int AS n FROM articles a WHERE ${where}`,
    PATTERNS
  );
  const remaining = Number(left[0]?.n) || 0;

  return NextResponse.json({
    deleted,
    remaining,
    done: remaining === 0,
    // The sitemaps are generated from this table, so the URLs leave the
    // sitemaps on their own. No index-removal calls are made: a sample of
    // these pages came back "URL is unknown to Google", so spending 62,778
    // Indexing API requests to retract pages Google never had would burn a
    // 200/day quota the live network needs.
    next:
      remaining > 0
        ? `/api/admin/purge-fabricated?key=…&confirm=${CONFIRM}&limit=${limit}`
        : null,
  });
}
