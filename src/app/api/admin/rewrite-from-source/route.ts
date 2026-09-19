import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { fetchSourceText } from "@/lib/pipeline/source-fetch";
import { rewriteFromSource } from "@/lib/pipeline/rewriter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Rebuild published articles from their original sources.
 *
 *   GET /api/admin/rewrite-from-source?key=CRON_SECRET&limit=3&dryRun=1
 *   GET /api/admin/rewrite-from-source?key=CRON_SECRET&limit=10
 *   GET /api/admin/rewrite-from-source?key=CRON_SECRET&progress=1
 *
 * Every article row kept its source_url, which is what makes a real repair
 * possible rather than a cosmetic one. Fetching the original gives the rewrite
 * actual quotations from named people and actual institutions, so the result
 * is sourced instead of merely plausible — and sourced is also what Google
 * rewards, so this is the same work for both reasons.
 *
 * Where the source is gone — expired, paywalled, moved — the article is
 * flagged and left untouched. Rewriting the fabricated text because the source
 * could not be reached would recreate the original problem while reporting
 * success, so a dead source is recorded as a dead source. Those are the
 * articles to consider deleting, since there is no longer anything to check
 * them against.
 */

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query("ALTER TABLE articles ADD COLUMN IF NOT EXISTS resourced_at TIMESTAMPTZ");
  await pool.query("ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_status TEXT");
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

  if (req.nextUrl.searchParams.get("progress") === "1") {
    const { rows } = await pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE resourced_at IS NOT NULL)::int AS done,
              count(*) FILTER (WHERE source_status = 'ok')::int AS rewritten,
              count(*) FILTER (WHERE source_status IS NOT NULL
                               AND source_status <> 'ok')::int AS sourceGone
         FROM articles
        WHERE source_url IS NOT NULL AND source_url <> ''`
    );
    const r = rows[0] || {};
    return NextResponse.json({
      articlesWithSource: Number(r.total) || 0,
      processed: Number(r.done) || 0,
      rewritten: Number(r.rewritten) || 0,
      sourceUnreachable: Number(r.sourcegone ?? r.sourceGone) || 0,
      remaining: (Number(r.total) || 0) - (Number(r.done) || 0),
    });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const limit = Math.min(25, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "5", 10) || 5));
  const onlySlug = req.nextUrl.searchParams.get("site");

  const { rows } = await pool.query(
    `SELECT a.id, a.title, a.slug, a.category, a.content, a.source_url, s.slug AS site_slug, s.domain
       FROM articles a JOIN sites s ON a.site_id = s.id
      WHERE a.resourced_at IS NULL
        AND a.source_url IS NOT NULL AND a.source_url <> ''
        ${onlySlug ? "AND s.slug = $2" : ""}
      ORDER BY a.published_at DESC
      LIMIT $1`,
    onlySlug ? [limit, onlySlug] : [limit]
  );

  if (rows.length === 0) {
    return NextResponse.json({ message: "Nothing left to process", processed: 0 });
  }

  const results: Record<string, unknown>[] = [];
  let rewritten = 0;
  let sourceGone = 0;
  let failed = 0;

  for (const row of rows) {
    const url = `https://${row.domain}/${row.category || "local-news"}/${row.slug}`;
    const site = sites[row.site_slug];

    const source = await fetchSourceText(row.source_url);
    if (!source.ok) {
      sourceGone++;
      if (!dryRun) {
        await pool.query(
          "UPDATE articles SET resourced_at = NOW(), source_status = $2 WHERE id = $1",
          [row.id, `unreachable: ${source.error}`.slice(0, 200)]
        );
      }
      results.push({ url, sourceReachable: false, error: source.error });
      continue;
    }

    try {
      const out = await rewriteFromSource(
        site?.name || row.site_slug,
        site?.state || "",
        site?.city || "",
        source.text!,
        source.publisher || "",
        source.finalUrl || row.source_url,
        row.category || "local-news"
      );

      if (!out.content || out.content.length < 300) {
        throw new Error("Rewrite came back too short to publish");
      }

      if (dryRun) {
        results.push({
          url,
          sourceReachable: true,
          publisher: source.publisher,
          oldTitle: row.title,
          newTitle: out.title,
          before: String(row.content).slice(0, 600),
          after: out.content.slice(0, 900),
        });
        rewritten++;
        continue;
      }

      await pool.query(
        `UPDATE articles
            SET title = $2, summary = $3, content = $4,
                resourced_at = NOW(), source_status = 'ok'
          WHERE id = $1`,
        [row.id, out.title || row.title, out.summary || "", out.content]
      );
      rewritten++;
      results.push({ url, sourceReachable: true, publisher: source.publisher, newTitle: out.title });
    } catch (e) {
      failed++;
      results.push({ url, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    dryRun,
    processed: rows.length,
    rewritten,
    sourceUnreachable: sourceGone,
    failed,
    note: dryRun
      ? "Nothing written. Read the before and after, then drop dryRun to apply."
      : "Applied. Articles whose source could not be reached are flagged in source_status and left untouched.",
    results,
  });
}
