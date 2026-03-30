import { NextRequest, NextResponse } from "next/server";
import { feeds, STATE_BATCHES, isPublishingHours } from "@/config/feeds";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { isDuplicate, insertFeedItem } from "@/lib/pipeline/dedup";
import {
  logRunStart,
  logRunEnd,
  isPipelineEnabled,
} from "@/lib/pipeline/scheduler";
import { sites } from "@/config/sites";

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

  // Find matching site entries for the states in this batch
  const siteEntries = Object.values(sites).filter((s) =>
    statesToProcess.includes(s.state)
  );

  for (const site of siteEntries) {
    const runId = await logRunStart("fetch", site.state);
    let siteFetched = 0;
    let siteFailed = 0;

    for (const feed of activeFeeds) {
      try {
        const url = feed.url(site.state, site.city);
        const items = await parseFeed(url);

        if (items.length === 0) {
          console.log(`[fetch] No items from ${feed.id} for ${site.state} — URL: ${url}`);
        }

        const limited = items.slice(0, feed.maxItems);

        for (const item of limited) {
          if (await isDuplicate(item)) {
            totalSkipped++;
            continue;
          }
          const id = await insertFeedItem(
            item,
            feed.id,
            feed.category,
            site.state
          );
          if (id) {
            siteFetched++;
            totalFetched++;
          }
        }

        // Rate limit: 500ms between Google News requests
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        siteFailed++;
        errors.push(`${feed.id}/${site.stateAbbr}: ${String(error)}`);
      }
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
    feeds: activeFeeds.length,
    fetched: totalFetched,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
    durationMs: Date.now() - startTime,
  });
}
