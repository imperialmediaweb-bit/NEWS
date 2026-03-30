import { NextRequest, NextResponse } from "next/server";
import { feeds } from "@/config/feeds";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { isDuplicate, insertFeedItem } from "@/lib/pipeline/dedup";
import {
  getCategoriesDue,
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

  const body = await req.json().catch(() => ({}));
  const requestedCategories: string[] | undefined = body.categories;

  // Determine which categories to fetch
  const dueCategories = requestedCategories || (await getCategoriesDue());
  if (dueCategories.length === 0) {
    return NextResponse.json({ message: "No categories due", fetched: 0 });
  }

  const startTime = Date.now();
  let totalFetched = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const category of dueCategories) {
    const runId = await logRunStart("fetch", category);
    const categoryFeeds = feeds.filter((f) => f.category === category);
    let categoryFetched = 0;
    let categoryFailed = 0;

    for (const feed of categoryFeeds) {
      try {
        if (feed.scope === "local") {
          // Fetch for each state site
          const siteEntries = Object.values(sites);
          for (const site of siteEntries) {
            const url =
              typeof feed.url === "function"
                ? feed.url(site.state, site.city)
                : feed.url;

            const items = await parseFeed(url);
            const limited = items.slice(0, feed.maxItems);

            for (const item of limited) {
              if (await isDuplicate(item)) {
                totalSkipped++;
                continue;
              }
              const id = await insertFeedItem(
                item,
                feed.id,
                category,
                site.state
              );
              if (id) {
                categoryFetched++;
                totalFetched++;
              }
            }

            // Rate limit: 500ms between Google News requests
            await new Promise((r) => setTimeout(r, 500));
          }
        } else {
          // National/World: fetch once
          const url = typeof feed.url === "string" ? feed.url : feed.url("");
          const items = await parseFeed(url);
          const limited = items.slice(0, feed.maxItems);

          for (const item of limited) {
            if (await isDuplicate(item)) {
              totalSkipped++;
              continue;
            }
            const id = await insertFeedItem(item, feed.id, category, null);
            if (id) {
              categoryFetched++;
              totalFetched++;
            }
          }

          await new Promise((r) => setTimeout(r, 500));
        }
      } catch (error) {
        categoryFailed++;
        errors.push(`${feed.id}: ${String(error)}`);
      }
    }

    await logRunEnd(
      runId,
      categoryFetched,
      categoryFailed,
      Date.now() - startTime,
      errors.length > 0 ? errors.join("; ") : undefined
    );
  }

  return NextResponse.json({
    categories: dueCategories,
    fetched: totalFetched,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined,
    durationMs: Date.now() - startTime,
  });
}
