import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getGscToken, listProperties, inspectUrl, hasGscCredentials } from "@/lib/gsc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Count how much of the archive contains invented attribution.
 *
 * Until now the rewriter prompt instructed the model to manufacture sourcing:
 *
 *   Instead use GENERIC official sources: "according to officials",
 *   "authorities confirmed", "sources familiar with the matter said" ...
 *   Include 2-3 natural attributions in the body to sound credible
 *
 * Every article in the database was written under that instruction, so these
 * phrases are not evidence of a rare failure — they are the house style. This
 * counts them so the scale is a number rather than a guess.
 *
 *   GET /api/admin/audit-fabrication?key=CRON_SECRET
 *   GET /api/admin/audit-fabrication?key=CRON_SECRET&sample=20&phrase=spokesperson
 *
 * A match is not proof that a given sentence is false — an article whose
 * source genuinely quoted a police department will match too. It is a measure
 * of exposure, and the sample is there so the results can be read rather than
 * trusted.
 */

/** Phrases the old prompt supplied verbatim, plus the shapes they produce. */
const PATTERNS: { label: string; sql: string }[] = [
  { label: "sources familiar", sql: "%sources familiar%" },
  { label: "a spokesperson said/stated", sql: "%spokesperson%" },
  { label: "officials confirmed", sql: "%officials confirmed%" },
  { label: "authorities confirmed", sql: "%authorities confirmed%" },
  { label: "according to officials", sql: "%according to officials%" },
  { label: "records show/indicate", sql: "%records show%" },
  { label: "data indicates", sql: "%data indicates%" },
  { label: "court documents reveal", sql: "%court documents reveal%" },
  { label: "investigators reported", sql: "%investigators reported%" },
  { label: "studies show", sql: "%studies show%" },
];

export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sampleSize = Math.min(50, Math.max(0, parseInt(req.nextUrl.searchParams.get("sample") || "0", 10) || 0));
  const phrase = req.nextUrl.searchParams.get("phrase");

  // Ask Google whether these articles are actually in its index.
  //
  //   GET /api/admin/audit-fabrication?key=…&inspect=30
  //
  // This decides how to remove them, not whether to. Deleting pages Google
  // holds and ranks is a different act from deleting pages it fetched and
  // declined to keep: the first needs 410s and sitemap removal so the
  // disappearance reads as intentional, the second costs nothing because
  // nothing is there. Guessing between those two is not acceptable when the
  // answer is one API call per URL against a 2,000/day quota.
  //
  // Only generated articles are sampled. The imported ones are somebody's
  // real reporting and are not candidates for removal.
  const inspectCount = Math.min(
    50,
    Math.max(0, parseInt(req.nextUrl.searchParams.get("inspect") || "0", 10) || 0)
  );
  if (inspectCount > 0) {
    if (!hasGscCredentials()) {
      return NextResponse.json(
        { error: "No Search Console credentials configured" },
        { status: 400 }
      );
    }

    const orClause = PATTERNS.map((_, i) => `a.content ILIKE $${i + 1}`).join(" OR ");
    const { rows } = await pool.query(
      `SELECT a.title, a.slug, a.category, a.published_at, a.source_url, s.domain
         FROM articles a JOIN sites s ON a.site_id = s.id
        WHERE (${orClause})
          AND a.wp_original_id IS NULL
        ORDER BY random()
        LIMIT $${PATTERNS.length + 1}`,
      [...PATTERNS.map((p) => p.sql), inspectCount]
    );

    const token = await getGscToken();
    const properties = await listProperties(token);

    const coverage: Record<string, number> = {};
    const inspected: {
      url: string;
      coverageState: string | null;
      lastCrawl: string | null;
    }[] = [];

    for (const r of rows) {
      const url = `https://${r.domain}/${r.category || "local-news"}/${r.slug}`;
      const props = properties.get(r.domain as string);
      const property = props?.[0]?.siteUrl;
      if (!property) {
        coverage["no verified property"] = (coverage["no verified property"] || 0) + 1;
        continue;
      }
      const result = await inspectUrl(token, property, url);
      const state = typeof result.coverageState === "string" ? result.coverageState : null;
      const key = state || "inspection failed";
      coverage[key] = (coverage[key] || 0) + 1;
      inspected.push({
        url,
        coverageState: state,
        lastCrawl: typeof result.lastCrawlTime === "string" ? result.lastCrawlTime : null,
      });
    }

    return NextResponse.json({
      inspectedCount: rows.length,
      scope: "generated articles matching a fabricated-attribution phrase",
      coverageStates: coverage,
      inspected,
    });
  }

  // A sample of actual articles for one phrase, so the number can be checked.
  if (phrase) {
    const { rows } = await pool.query(
      `SELECT a.title, a.slug, a.category, a.published_at, s.domain
         FROM articles a JOIN sites s ON a.site_id = s.id
        WHERE a.content ILIKE $1
        ORDER BY a.published_at DESC
        LIMIT $2`,
      [`%${phrase}%`, sampleSize || 20]
    );
    return NextResponse.json({
      phrase,
      sample: rows.map((r) => ({
        title: r.title,
        url: `https://${r.domain}/${r.category || "local-news"}/${r.slug}`,
        publishedAt: r.published_at,
      })),
    });
  }

  const { rows: totalRows } = await pool.query("SELECT count(*)::int AS total FROM articles");
  const total = Number(totalRows[0]?.total) || 0;

  const counts: Record<string, number> = {};
  for (const p of PATTERNS) {
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM articles WHERE content ILIKE $1",
      [p.sql]
    );
    counts[p.label] = Number(rows[0]?.n) || 0;
  }

  // Articles matching at least one pattern — the figure that matters, since
  // one article usually trips several.
  const orClause = PATTERNS.map((_, i) => `content ILIKE $${i + 1}`).join(" OR ");
  const { rows: anyRows } = await pool.query(
    `SELECT count(*)::int AS n FROM articles WHERE ${orClause}`,
    PATTERNS.map((p) => p.sql)
  );
  const affected = Number(anyRows[0]?.n) || 0;

  // Split the matches by who wrote them. This is the whole decision.
  //
  // wp_original_id marks an article imported from a WordPress site that
  // already existed — someone's actual reporting. "A spokesperson said" is
  // ordinary journalism in that half of the archive, and 56,085 articles match
  // that phrase alone. Treating the two halves alike once produced a
  // recommendation to delete most of the archive, which was wrong; the phrase
  // only indicates fabrication in text this pipeline generated under a prompt
  // that instructed it to manufacture sourcing.
  const { rows: provRows } = await pool.query(
    `SELECT
       count(*) FILTER (WHERE wp_original_id IS NOT NULL)::int AS imported,
       count(*) FILTER (WHERE wp_original_id IS NULL)::int     AS generated,
       count(*) FILTER (WHERE wp_original_id IS NULL
                          AND (source_url IS NULL OR source_url = ''))::int
         AS generatedNoSource
     FROM articles WHERE ${orClause}`,
    PATTERNS.map((p) => p.sql)
  );

  return NextResponse.json({
    totalArticles: total,
    articlesWithAtLeastOnePattern: affected,
    percentage: total > 0 ? Number(((affected / total) * 100).toFixed(1)) : 0,
    byPhrase: counts,
    // imported: real reporting that happens to use the phrase. Not ours to
    // judge and not fabricated.
    // generated: written by this pipeline under the fabricating prompt.
    // generatedNoSource: the same, with no source URL, so there is nothing to
    //   check the claims against and no way to rebuild the article honestly.
    byProvenance: provRows[0] || {},
    caveat:
      "A match means the phrase is present, not that it is false — an article whose source genuinely quoted a named agency matches too. Use &phrase=<text>&sample=20 to read real examples before drawing conclusions.",
  });
}
