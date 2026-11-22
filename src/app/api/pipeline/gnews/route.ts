import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import pool from "@/lib/db";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { duplicateReason, insertFeedItem, loadDedupContext } from "@/lib/pipeline/dedup";
import { isRelevantToState } from "@/lib/pipeline/relevance";
import { gnewsSearchUrl, stateQueries, trendQueries, resolveGoogleNews, skippableHost, splitPublisher, googlePaused } from "@/lib/pipeline/google-news";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Google News searches per state, into the normal queue.
 *
 *   GET /api/pipeline/gnews?key=CRON_SECRET&states=Texas,Ohio[&dry=1]
 *   GET /api/pipeline/gnews?key=CRON_SECRET&slot=N   (the cron rotates states)
 *
 * Five searches per state — its main cities, then its politics, business,
 * sports and life — over the last day. A result is kept only when Google's
 * link resolves to the publisher's own page (lib/pipeline/google-news.ts), is
 * not an aggregator or social post, is not already known, and is about the
 * state. It then goes through the same queue as feed stories: the rewrite
 * fetches the publisher's full text and rejects a source too thin to write
 * from without inventing.
 *
 * At most PER_STATE stories per state per run, so the rewrite bill stays known.
 */
// 12 from the standing searches plus up to 6 from what the state is searching today
const PER_STATE = 18;
const PER_QUERY = 5;
const STATES_PER_SLOT = 5;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.GNEWS === "0") return NextResponse.json({ skipped: "GNEWS=0" });

  // What Google News brought in the last day and what became of it.
  if (req.nextUrl.searchParams.get("report") === "1") {
    const { rows: byStatus } = await pool.query(
      `SELECT status, count(*)::int AS n FROM feed_items
        WHERE source_feed LIKE 'gnews:%' AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status ORDER BY n DESC`
    );
    const { rows: reasons } = await pool.query(
      `SELECT left(error_message, 90) AS reason, count(*)::int AS n FROM feed_items
        WHERE source_feed LIKE 'gnews:%' AND created_at > NOW() - INTERVAL '24 hours' AND status = 'failed'
        GROUP BY 1 ORDER BY n DESC LIMIT 8`
    );
    const { rows: published } = await pool.query(
      `SELECT a.category, left(a.title, 90) AS title, s.state FROM articles a
         JOIN feed_items f ON f.source_url = a.source_url JOIN sites s ON s.id = a.site_id
        WHERE f.source_feed LIKE 'gnews:%' AND a.published_at > NOW() - INTERVAL '24 hours'
        ORDER BY a.published_at DESC LIMIT 12`
    ).catch(() => ({ rows: [] }));
    return NextResponse.json({ byStatus, reasons, published });
  }

  const all = Object.values(sites);
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const statesParam = req.nextUrl.searchParams.get("states");
  const slot = parseInt(req.nextUrl.searchParams.get("slot") || "", 10);
  const chosen = statesParam
    ? all.filter((s) => statesParam.split(",").map((x) => x.trim().toLowerCase()).includes(s.state.toLowerCase()))
    : Number.isFinite(slot)
      ? all.filter((_, i) => Math.floor(i / STATES_PER_SLOT) === slot % Math.ceil(all.length / STATES_PER_SLOT))
      : [];
  if (chosen.length === 0) return NextResponse.json({ error: "no states" }, { status: 400 });

  const ctx = await loadDedupContext();
  const report: Record<string, { found: number; known: number; unresolved: number; skippedHost: number; offState: number; queued: number; examples: string[] }> = {};

  for (const site of chosen) {
    const r = (report[site.state] = { found: 0, known: 0, unresolved: 0, skippedHost: 0, offState: 0, queued: 0, examples: [] as string[] });
    // what the state is searching Google for today first, then the standing searches
    const queries: Array<{ q: string; section: string; max?: number }> = [
      ...(await trendQueries(site.state, site.stateAbbr)),
      ...stateQueries(site.state, Number.isFinite(slot) ? slot : Math.floor(Date.now() / 1800000)),
    ];
    for (const { q, section, max } of queries) {
      if (r.queued >= PER_STATE || googlePaused()) break;
      let items;
      try {
        items = await parseFeed(gnewsSearchUrl(q));
      } catch {
        continue;
      }
      let taken = 0;
      for (const raw of items) {
        if (taken >= (max ?? PER_QUERY) || r.queued >= PER_STATE || googlePaused()) break;
        r.found++;
        const { title, publisher } = splitPublisher(raw);
        // Known by title already? Then skip it before spending a Google call.
        if ((await duplicateReason({ ...raw, title }, ctx)) === "title") { r.known++; continue; }
        const url = await resolveGoogleNews(raw.link);
        if (!url) { r.unresolved++; continue; }
        if (skippableHost(url)) {
          r.skippedHost++;
          if (dry && r.examples.length < 8) r.examples.push(`skipped host: ${url.slice(0, 90)}`);
          continue;
        }
        const item = { ...raw, guid: "", link: url, title, source: publisher };
        // No second dedup call: duplicateReason records each title it checks,
        // so checking again would match the item against itself. A story
        // already queued under the same URL is refused by the insert.
        if (!isRelevantToState(item.title, item.description || "", site.state, site.city).relevant) { r.offState++; continue; }
        taken++;
        if (dry) {
          r.queued++;
          if (r.examples.length < 8) r.examples.push(`[${section}] ${title} — ${url}`);
          continue;
        }
        const id = await insertFeedItem(item, max === 2 && q.startsWith('"') ? `gnews:trend` : `gnews:${section}`, section, site.state);
        if (id) {
          r.queued++;
          if (r.examples.length < 5) r.examples.push(`[${section}] ${title}`);
        }
      }
    }
  }

  return NextResponse.json({ dry, paused: googlePaused(), states: chosen.map((s) => s.state), report });
}
