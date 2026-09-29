import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { stripInventedAttribution } from "@/lib/pipeline/rewriter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Work through the published archive removing invented attribution.
 *
 *   GET /api/admin/defabricate?key=CRON_SECRET&limit=20
 *   GET /api/admin/defabricate?key=CRON_SECRET&limit=3&dryRun=1
 *   GET /api/admin/defabricate?key=CRON_SECRET&progress=1
 *
 * 72,462 of 755,643 articles contain the phrases the old prompt dictated. This
 * cannot be a single run: each article is an LLM call, so the whole archive is
 * ~72,000 calls, and it has to be chewed through in batches over days.
 *
 * What this does NOT do is restore accuracy. The source material is gone, so
 * the invented facts in those articles cannot be checked against anything.
 * All that is repaired is the false sourcing — the sentences claiming a real
 * organisation said something it never said. That is the part with a named
 * victim, and it is the part that can be fixed without knowing the truth.
 *
 * Articles are marked as processed so a rerun continues rather than starting
 * over, and dryRun shows the before and after without writing.
 */

/**
 * Sentences present in one version and not the other, so a dry run shows the
 * actual edit rather than an identical-looking preview.
 */
function sentenceDiff(before: string, after: string) {
  const split = (html: string) =>
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

  const b = split(before);
  const a = split(after);
  const aSet = new Set(a);
  const bSet = new Set(b);

  return [
    ...b.filter((s) => !aSet.has(s)).map((s) => ({ removed: s })),
    ...a.filter((s) => !bSet.has(s)).map((s) => ({ added: s })),
  ];
}

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

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  // A column rather than a side table: the flag belongs to the article, and a
  // join on 755k rows every batch would not be free.
  await pool.query(
    "ALTER TABLE articles ADD COLUMN IF NOT EXISTS defabricated_at TIMESTAMPTZ"
  );
  await pool.query(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_defabricated
       ON articles (defabricated_at) WHERE defabricated_at IS NULL`
  ).catch(() => {
    // CONCURRENTLY cannot run inside a transaction on some setups; the column
    // works without the index, just slower.
  });
  schemaReady = true;
}

export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchema();

  const orClause = PATTERNS.map((_, i) => `content ILIKE $${i + 1}`).join(" OR ");

  if (req.nextUrl.searchParams.get("progress") === "1") {
    const { rows } = await pool.query(
      `SELECT count(*) FILTER (WHERE defabricated_at IS NOT NULL)::int AS done,
              count(*)::int AS total
         FROM articles
        WHERE ${orClause}`,
      PATTERNS
    );
    const done = Number(rows[0]?.done) || 0;
    const total = Number(rows[0]?.total) || 0;
    return NextResponse.json({
      done,
      remaining: total - done,
      total,
      percentage: total > 0 ? Number(((done / total) * 100).toFixed(1)) : 0,
    });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20));

  const { rows } = await pool.query(
    `SELECT a.id, a.title, a.content, a.slug, a.category, a.published_at, s.domain
       FROM articles a JOIN sites s ON a.site_id = s.id
      WHERE a.defabricated_at IS NULL AND (${orClause})
      -- Oldest first. Sorting newest-first started with articles the repaired
      -- pipeline had just written from real sources — the ones that need
      -- nothing — while the fabricated archive underneath went untouched.
      ORDER BY a.published_at ASC
      LIMIT $${PATTERNS.length + 1}`,
    [...PATTERNS, limit]
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "Nothing left to process", processed: 0 });
  }

  const results: Record<string, unknown>[] = [];
  let changed = 0;
  let unchanged = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const out = await stripInventedAttribution(row.title, row.content);

      if (dryRun) {
        results.push({
          url: `https://${row.domain}/${row.category || "local-news"}/${row.slug}`,
          title: row.title,
          changed: out.changed,
          publishedAt: row.published_at,
          // The edits are scattered through the body, so showing the opening
          // of each version proves nothing — both look the same. Show the
          // sentences that actually differ.
          edits: sentenceDiff(String(row.content), out.content).slice(0, 6),
        });
        if (out.changed) changed++;
        else unchanged++;
        continue;
      }

      if (out.changed) {
        await pool.query(
          "UPDATE articles SET content = $2, defabricated_at = NOW() WHERE id = $1",
          [row.id, out.content]
        );
        changed++;
      } else {
        // Mark it anyway — it has been looked at, and re-examining it every
        // run would spend the budget on articles that need nothing.
        await pool.query(
          "UPDATE articles SET defabricated_at = NOW() WHERE id = $1",
          [row.id]
        );
        unchanged++;
      }

      results.push({
        url: `https://${row.domain}/${row.category || "local-news"}/${row.slug}`,
        changed: out.changed,
      });
    } catch (e) {
      failed++;
      results.push({
        id: row.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    dryRun,
    processed: rows.length,
    changed,
    unchanged,
    failed,
    note: dryRun
      ? "Nothing written. Compare before and after, then drop dryRun to apply."
      : "Applied. Edge cache holds article pages for a day, so public pages update as the cache expires.",
    results,
  });
}
