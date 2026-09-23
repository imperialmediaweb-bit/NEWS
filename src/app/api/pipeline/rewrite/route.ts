import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { isPublishingHours } from "@/config/feeds";
import { rewriteArticle, rewriteFromSource } from "@/lib/pipeline/rewriter";
import { fetchSourceText } from "@/lib/pipeline/source-fetch";
import { findImage } from "@/lib/pipeline/images";
import { publishArticle } from "@/lib/pipeline/publisher";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";
import { sites } from "@/config/sites";

/**
 * Minimum characters of real source material before an article is worth
 * writing. Below this the model would be filling in rather than reporting.
 * The Romanian network landed on 500 after starting at 800.
 */
const MIN_SOURCE_CHARS = 500;

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
  const batchSize = body.batchSize || 10;

  const startTime = Date.now();
  const runId = await logRunStart("rewrite");

  // Take the freshest pending item from as many different states as possible.
  //
  // This used to be a plain `ORDER BY created_at ASC LIMIT 10` over the whole
  // queue, which had two problems. It published the stalest news first, on a
  // news site. And because the queue is one shared FIFO for all fifty states,
  // whichever states happened to be near the front consumed the entire budget:
  // Florida was sitting on 36,045 pending items, Georgia 23,733 and Delaware
  // 15,552, none of them failing, just never reached — those three had not
  // published an article in two days while the rest of the network was fine.
  //
  // row_number() per state and ordering by it takes one item from each state
  // before taking a second from any, so a large backlog can no longer starve
  // anyone. Restricting to the last day both bounds the scan and stops us
  // publishing two-week-old items as news.
  const { rows: pending } = await pool.query(
    `UPDATE feed_items SET status = 'processing'
     WHERE id IN (
       SELECT id FROM (
         SELECT id,
                row_number() OVER (PARTITION BY state ORDER BY created_at DESC) AS rn
           FROM feed_items
          WHERE status = 'pending'
            AND created_at > NOW() - INTERVAL '24 hours'
       ) ranked
       ORDER BY rn ASC
       LIMIT $1
     )
     RETURNING *`,
    [batchSize]
  );

  if (pending.length === 0) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime);
    return NextResponse.json({ message: "No pending items", processed: 0 });
  }

  let processed = 0;
  let failed = 0;
  const results: { feedItemId: number; title: string; state: string }[] = [];
  // Rejections come back in the response, not only into a column nobody reads.
  const rejections: { state: string; reason: string }[] = [];

  for (const item of pending) {
    try {
      // Every feed_item has a state — find the matching site for context
      const siteEntry = Object.values(sites).find(
        (s) => s.state === item.state
      );

      if (!siteEntry) {
        throw new Error(`No site config for state: ${item.state}`);
      }

      // Fetch the source article before rewriting.
      //
      // This pipeline used to hand the model a headline and the one or two
      // sentences of RSS description, then ask for a full article — so
      // everything beyond those two sentences had to be invented, which is
      // exactly how a high-school athlete ended up with fabricated quotes from
      // his coaches and from a state athletic association. The Romanian
      // network solved this first and its own comment says why: read the
      // source, and skip anything too thin, "fără halucinare".
      //
      // The gate therefore belongs on the INPUT. A story with no real material
      // behind it should not be published at all, rather than published as
      // invention and then judged on its length afterwards.
      const source = await fetchSourceText(item.source_url);
      const material = source.ok ? source.text! : (item.description || "");

      if (material.length < MIN_SOURCE_CHARS) {
        failed++;
        const reason = `Source too thin: ${material.length} chars (need ${MIN_SOURCE_CHARS}) — not enough to write from without inventing`;
        rejections.push({ state: item.state, reason });
        await pool.query(
          "UPDATE feed_items SET status = 'failed', error_message = $2 WHERE id = $1",
          [item.id, reason]
        );
        continue;
      }

      // With the real article in hand, write from it — real quotes from named
      // people, real institutions. Without it, fall back to the old path on
      // the description alone.
      const rewrite = source.ok
        ? await rewriteFromSource(
            siteEntry.name,
            siteEntry.state,
            siteEntry.city,
            material,
            source.publisher || "",
            source.finalUrl || item.source_url,
            item.category
          )
        : await rewriteArticle(
            siteEntry.name,
            siteEntry.state,
            siteEntry.city,
            item.title,
            item.description || "",
            item.source_url,
            item.category
          );

      // Find an image (with category fallback for precision)
      const image = await findImage(rewrite.suggestedImageQuery, item.category);

      // Publish to the single matching state site
      const published = await publishArticle({
        feedItemId: item.id,
        rewrite,
        category: item.category,
        sourceUrl: item.source_url,
        imageUrl: image?.url || null,
        state: item.state,
      });

      // publishArticle returns 0 when it rejects the article or hits a
      // duplicate slug, and only marks the feed item when it actually
      // publishes. Ignoring that return left every rejected item sitting at
      // 'processing' for ever — 46 per state had piled up — while the run
      // counted it as processed and reported success.
      if (published.published === 0) {
        failed++;
        const reason = published.reason || "Not published (no reason given)";
        rejections.push({ state: item.state, reason });
        await pool.query(
          "UPDATE feed_items SET status = 'failed', error_message = $2 WHERE id = $1",
          [item.id, reason.slice(0, 500)]
        );
        continue;
      }

      processed++;
      results.push({
        feedItemId: item.id,
        title: rewrite.title,
        state: item.state,
      });
    } catch (error) {
      failed++;
      await pool.query(
        "UPDATE feed_items SET status = 'failed', error_message = $2 WHERE id = $1",
        [item.id, String(error).slice(0, 500)]
      );
      console.error(`Rewrite failed for feed_item ${item.id}:`, error);
    }
  }

  await logRunEnd(runId, processed, failed, Date.now() - startTime);

  return NextResponse.json({
    processed,
    failed,
    results,
    ...(rejections.length > 0 && { rejections }),
    durationMs: Date.now() - startTime,
  });
}
