import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { feeds, STATE_BATCHES } from "@/config/feeds";
import { parseFeed } from "@/lib/pipeline/rss-parser";
import { generateGuid } from "@/lib/pipeline/dedup";
import { rewriteArticleShort } from "@/lib/pipeline/rewriter";
import { findImage } from "@/lib/pipeline/images";
import { publishArticle } from "@/lib/pipeline/publisher";
import { logRunStart, logRunEnd } from "@/lib/pipeline/scheduler";
import { sites } from "@/config/sites";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/**
 * Seed endpoint — bulk populate sites with initial content.
 * Fetches ALL recent articles (no "when:" filter) and writes short 300-500 word versions.
 *
 * Usage: POST /api/pipeline/seed
 * Body: { batch: 0-4, maxPerCategory?: number }
 *
 * Run 5 times (batch 0-4) to seed all 50 states.
 * Each batch processes 10 states × 13 categories × maxPerCategory articles.
 *
 * Estimated: batch=0, maxPerCategory=4 → 10 states × 13 cats × 4 = ~520 articles
 * Cost per batch: ~$0.44 (Gemini Flash) or ~$1.10 (rotation)
 * Total for all 50 states: ~$2.20 - $5.50
 */
export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchIndex: number = body.batch ?? 0;
  const maxPerCategory: number = body.maxPerCategory ?? 4;

  if (batchIndex < 0 || batchIndex >= STATE_BATCHES.length) {
    return NextResponse.json({ error: "batch must be 0-4" }, { status: 400 });
  }

  const statesToProcess = STATE_BATCHES[batchIndex];
  const siteEntries = Object.values(sites).filter((s) =>
    statesToProcess.includes(s.state)
  );

  const startTime = Date.now();
  const runId = await logRunStart("seed", `batch-${batchIndex}`);

  let totalPublished = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  // Seed feeds without "when:" filter — take from all time
  const seedFeeds = feeds.map((f) => ({
    ...f,
    // Override URL to remove "when:" filter for maximum article variety
    seedUrl: (state: string, city?: string) => {
      const query = f.url(state, city);
      // Strip +when:Xh from the URL
      return query.replace(/\+when%3A\d+h/i, "").replace(/\+when:\d+h/i, "");
    },
  }));

  for (const site of siteEntries) {
    for (const feed of seedFeeds) {
      try {
        const url = feed.seedUrl(site.state, site.city);
        const items = await parseFeed(url);
        const limited = items.slice(0, maxPerCategory);

        for (const item of limited) {
          const guid = generateGuid(item);

          // Check if already exists
          const { rows: existing } = await pool.query(
            "SELECT id FROM feed_items WHERE guid = $1",
            [guid]
          );
          if (existing.length > 0) {
            totalSkipped++;
            continue;
          }

          try {
            // Rewrite short
            const rewrite = await rewriteArticleShort(
              site.name,
              site.state,
              site.city,
              item.title,
              item.description || "",
              feed.category
            );

            // Get image
            const image = await findImage(rewrite.suggestedImageQuery, feed.category);

            // Insert feed item
            await pool.query(
              `INSERT INTO feed_items (guid, source_feed, source_url, title, description, category, state, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'rewritten')
               ON CONFLICT (guid) DO NOTHING`,
              [guid, feed.id, item.link, item.title, item.description, feed.category, site.state]
            );

            // Publish
            const published = await publishArticle({
              feedItemId: 0,
              rewrite,
              category: feed.category,
              sourceUrl: item.link,
              imageUrl: image?.url || null,
              state: site.state,
            });

            if (published > 0) totalPublished++;
          } catch (err) {
            totalFailed++;
            errors.push(`${site.stateAbbr}/${feed.category}: ${String(err).slice(0, 100)}`);
          }
        }

        // Rate limit between feeds
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        errors.push(`${site.stateAbbr}/${feed.id} fetch: ${String(err).slice(0, 100)}`);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  await logRunEnd(runId, totalPublished, totalFailed, durationMs);

  return NextResponse.json({
    batch: batchIndex,
    states: statesToProcess,
    published: totalPublished,
    skipped: totalSkipped,
    failed: totalFailed,
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    durationMs,
    estimatedCost: `$${(totalPublished * 0.002).toFixed(2)} (rotation)`,
  });
}
