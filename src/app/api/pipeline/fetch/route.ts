import { NextRequest, NextResponse } from "next/server";
import { feeds, STATE_BATCHES, isPublishingHours } from "@/config/feeds";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { isDuplicate, insertFeedItem, loadDedupContext } from "@/lib/pipeline/dedup";
import {
  logRunStart,
  logRunEnd,
  isPipelineEnabled,
} from "@/lib/pipeline/scheduler";
import { sites } from "@/config/sites";
import pool from "@/lib/db";

export const maxDuration = 300;

/**
 * Stop starting new sites past this point so a run always returns cleanly.
 */
const RUN_BUDGET_MS = 210_000;

/**
 * Feeds to fetch at once per site. Sequentially, 14 feeds with a 500ms gap
 * plus Google News latency runs 40-60 seconds per site, so a batch of ten
 * could not finish inside any sane budget and the tail was always dropped.
 * Four at a time keeps the request rate polite while bringing a site under
 * twenty seconds.
 */
const FEED_CONCURRENCY = 4;

/**
 * Order a batch's sites by how long since each last had a successful fetch,
 * oldest first. Fixed ordering meant a run that ran out of time dropped the
 * same states every time and they never caught up — Connecticut, Delaware,
 * Florida and Georgia sat at the end of their batch and went a fortnight
 * without an article while the first half published normally.
 */
async function orderByStaleness(states: string[]): Promise<Map<string, number>> {
  const lastRun = new Map<string, number>();
  try {
    const { rows } = await pool.query(
      `SELECT category AS state, max(completed_at) AS last_ok
         FROM pipeline_runs
        WHERE stage = 'fetch' AND error_message IS NULL AND category = ANY($1)
        GROUP BY category`,
      [states]
    );
    for (const row of rows) {
      if (row.state && row.last_ok) {
        lastRun.set(row.state as string, new Date(row.last_ok).getTime());
      }
    }
  } catch (e) {
    console.error("[fetch] staleness lookup failed:", e instanceof Error ? e.message : e);
  }
  return lastRun;
}

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPipelineEnabled())) {
    return NextResponse.json({ message: "Pipeline disabled" });
  }

  if (!isPublishingHours()) {
    return NextResponse.json({ message: "Outside publishing hours (6 AM - 10 PM ET)" });
  }

  const body = await req.json().catch(() => ({}));
  const batchIndex: number | undefined = body.batch;
  const requestedCategories: string[] | undefined = body.categories;
  // Where in the batch to start. The states are processed in order, so if a
  // run is cut short it is always the same tail that gets skipped — which is
  // how Colorado through Georgia ended up silent while the first half of the
  // same batch published normally. Advancing the start position each time the
  // batch comes round means every state gets to go first eventually.
  const rotate: number = Number.isFinite(body.rotate) ? Number(body.rotate) : 0;

  // Determine which states to process based on batch index (0-4)
  let statesToProcess: string[];
  if (batchIndex !== undefined && batchIndex >= 0 && batchIndex < STATE_BATCHES.length) {
    statesToProcess = STATE_BATCHES[batchIndex];
  } else if (batchIndex === undefined) {
    // No batch specified — process all (for manual testing, not recommended for cron)
    statesToProcess = STATE_BATCHES.flat();
  } else {
    return NextResponse.json({ error: "Invalid batch index (0-4)" }, { status: 400 });
  }

  // Filter feeds by category if specified
  const activeFeeds = requestedCategories
    ? feeds.filter((f) => requestedCategories.includes(f.category))
    : feeds;

  const startTime = Date.now();
  let totalFetched = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  // Find matching site entries for the states in this batch, oldest fetch
  // first. `rotate` only breaks ties between sites that are equally stale.
  const matched = Object.values(sites).filter((s) => statesToProcess.includes(s.state));
  const lastRun = await orderByStaleness(statesToProcess);
  const siteEntries = [...matched]
    .map((site, i) => ({ site, i }))
    .sort((a, b) => {
      // Never successfully fetched sorts first.
      const aTime = lastRun.get(a.site.state) ?? 0;
      const bTime = lastRun.get(b.site.state) ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return ((a.i + rotate) % matched.length) - ((b.i + rotate) % matched.length);
    })
    .map((e) => e.site);

  // Load the dedup lookback window ONCE for the whole run.
  const dedupCtx = await loadDedupContext();

  const skipped: string[] = [];
  for (const site of siteEntries) {
    if (Date.now() - startTime > RUN_BUDGET_MS) {
      skipped.push(site.state);
      continue;
    }
    const runId = await logRunStart("fetch", site.state);
    let siteFetched = 0;
    let siteFailed = 0;

    // Fetch the feeds a few at a time, but insert their items one feed at a
    // time: dedup compares each item against the ones already inserted in this
    // run, so concurrent inserts would let duplicates through.
    for (let i = 0; i < activeFeeds.length; i += FEED_CONCURRENCY) {
      const group = activeFeeds.slice(i, i + FEED_CONCURRENCY);

      const fetched = await Promise.all(
        group.map(async (feed) => {
          try {
            const url = feed.url(site.state, site.city);
            const items = await parseFeed(url);
            if (items.length === 0) {
              console.log(`[fetch] No items from ${feed.id} for ${site.state} — URL: ${url}`);
            }
            return { feed, items: items.slice(0, feed.maxItems) };
          } catch (error) {
            siteFailed++;
            errors.push(`${feed.id}/${site.stateAbbr}: ${String(error)}`);
            return { feed, items: [] };
          }
        })
      );

      for (const { feed, items } of fetched) {
        for (const item of items) {
          if (await isDuplicate(item, dedupCtx)) {
            totalSkipped++;
            continue;
          }
          const id = await insertFeedItem(item, feed.id, feed.category, site.state);
          if (id) {
            siteFetched++;
            totalFetched++;
          }
        }
      }

      // Stay polite to Google News between groups.
      await new Promise((r) => setTimeout(r, 500));
    }

    await logRunEnd(
      runId,
      siteFetched,
      siteFailed,
      Date.now() - startTime,
      siteFailed > 0 ? errors.slice(-siteFailed).join("; ") : undefined
    );
  }

  return NextResponse.json({
    batch: batchIndex,
    states: statesToProcess,
    startedAt: siteEntries[0]?.state,
    feeds: activeFeeds.length,
    fetched: totalFetched,
    skipped: totalSkipped,
    // States the run had no time left for — they lead the next rotation.
    ranOutOfTimeFor: skipped.length > 0 ? skipped : undefined,
    errors: errors.length > 0 ? errors : undefined,
    durationMs: Date.now() - startTime,
  });
}
