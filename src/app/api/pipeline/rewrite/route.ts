import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { isPublishingHours } from "@/config/feeds";
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

  if (!isPublishingHours()) {
    return NextResponse.json({ message: "Outside publishing hours (6 AM - 10 PM ET)" });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = body.batchSize || 10;

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
  const results: { feedItemId: number; title: string; state: string }[] = [];

  for (const item of pending) {
    try {
      // Every feed_item has a state — find the matching site for context
      const siteEntry = Object.values(sites).find(
        (s) => s.state === item.state
      );

      if (!siteEntry) {
        throw new Error(`No site config for state: ${item.state}`);
      }

      // Rewrite with LLM using the specific site context
      const rewrite = await rewriteArticle(
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
      await publishArticle({
        feedItemId: item.id,
        rewrite,
        category: item.category,
        sourceUrl: item.source_url,
        imageUrl: image?.url || null,
        state: item.state,
      });

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
    durationMs: Date.now() - startTime,
  });
}
