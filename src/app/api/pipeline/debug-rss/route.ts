import { NextRequest, NextResponse } from "next/server";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { isDuplicate, insertFeedItem } from "@/lib/pipeline/dedup";

function authCheck(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key");
  return token === process.env.CRON_SECRET;
}

/**
 * Debug endpoint — test the full pipeline flow for one state.
 * GET /api/pipeline/debug-rss?key=SECRET&state=California
 * GET /api/pipeline/debug-rss?key=SECRET&state=California&insert=true  (actually inserts)
 */
export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = req.nextUrl.searchParams.get("state") || "California";
  const doInsert = req.nextUrl.searchParams.get("insert") === "true";
  const query = `${state} news`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  const results: Record<string, unknown> = { url, state };

  try {
    // Step 1: Test parseFeed (the actual function used by the pipeline)
    const items = await parseFeed(url);
    results.parseFeedItemCount = items.length;
    results.first5Items = items.slice(0, 5).map((item) => ({
      guid: item.guid?.slice(0, 50),
      title: item.title?.slice(0, 100),
      link: item.link?.slice(0, 100),
      hasDescription: !!item.description,
      pubDate: item.pubDate,
    }));

    if (items.length === 0) {
      // Also try raw fetch to compare
      const rawRes = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      const rawText = await rawRes.text();
      results.rawFetchStatus = rawRes.status;
      results.rawContentLength = rawText.length;
      results.rawItemCount = (rawText.match(/<item>/g) || []).length;
      results.rawFirst300 = rawText.slice(0, 300);
    }

    // Step 2: Test dedup for first 3 items
    if (items.length > 0) {
      const dedupResults = [];
      for (const item of items.slice(0, 3)) {
        const dup = await isDuplicate(item);
        dedupResults.push({
          title: item.title?.slice(0, 60),
          isDuplicate: dup,
        });
      }
      results.dedupCheck = dedupResults;
    }

    // Step 3: Optionally insert first 5 items to test the full flow
    if (doInsert && items.length > 0) {
      const insertResults = [];
      for (const item of items.slice(0, 5)) {
        const dup = await isDuplicate(item);
        if (!dup) {
          const id = await insertFeedItem(
            item,
            "debug-test",
            "local-news",
            state
          );
          insertResults.push({
            title: item.title?.slice(0, 60),
            insertedId: id,
          });
        } else {
          insertResults.push({
            title: item.title?.slice(0, 60),
            skipped: "duplicate",
          });
        }
      }
      results.insertResults = insertResults;
    }

    return NextResponse.json(results);
  } catch (error) {
    results.error = String(error);
    results.stack = (error as Error)?.stack?.slice(0, 500);
    return NextResponse.json(results);
  }
}
