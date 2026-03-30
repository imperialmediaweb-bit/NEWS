import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { rewriteArticle } from "@/lib/pipeline/rewriter";
import { findImage } from "@/lib/pipeline/images";
import { publishArticle } from "@/lib/pipeline/publisher";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";
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
  const batchSize = body.batchSize || 5;

  const startTime = Date.now();
  const runId = await logRunStart("rewrite");

  // Pick oldest pending feed items
  const { rows: pending } = await pool.query(
    `UPDATE feed_items SET status = 'processing'
     WHERE id IN (
       SELECT id FROM feed_items WHERE status = 'pending'
       ORDER BY created_at ASC LIMIT $1
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
  const results: { feedItemId: number; title: string; published: number }[] = [];

  for (const item of pending) {
    try {
      // Find a representative site for the rewrite context
      let siteName = "MediaChief News";
      let state = "United States";
      let city = "New York";

      if (item.state) {
        const siteEntry = Object.values(sites).find(
          (s) => s.state === item.state
        );
        if (siteEntry) {
          siteName = siteEntry.name;
          state = siteEntry.state;
          city = siteEntry.city;
        }
      } else {
        // For national articles, use a generic context (first site)
        const firstSite = Object.values(sites)[0];
        siteName = firstSite.name;
        state = firstSite.state;
        city = firstSite.city;
      }

      // Rewrite with LLM
      const rewrite = await rewriteArticle(
        siteName,
        state,
        city,
        item.title,
        item.description || "",
        item.source_url,
        item.category
      );

      // Find an image
      const image = await findImage(rewrite.suggestedImageQuery);

      // Publish to appropriate sites
      const scope = item.state ? "local" : "national";
      const publishedCount = await publishArticle({
        feedItemId: item.id,
        rewrite,
        category: item.category,
        sourceUrl: item.source_url,
        imageUrl: image?.url || null,
        scope: scope as "local" | "national" | "world",
        state: item.state,
      });

      processed++;
      results.push({
        feedItemId: item.id,
        title: rewrite.title,
        published: publishedCount,
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
    durationMs: Date.now() - startTime,
  });
}
