import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logRunStart, logRunEnd } from "@/lib/pipeline/scheduler";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/**
 * Clean up old feed_items and pipeline_runs to prevent table bloat.
 * Keeps items for 7 days, runs for 30 days.
 */
export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const runId = await logRunStart("cleanup");

  try {
    // Old feed items, ANY status. The previous filter listed only
    // 'rewritten'/'failed'/'skipped', which excluded the two statuses that
    // actually accumulate: 'pending' (ingest outruns rewrite ~58:1) and
    // 'processing' (orphaned when a batch crashes mid-run, never reset).
    const feedResult = await pool.query(
      `DELETE FROM feed_items WHERE created_at < NOW() - INTERVAL '7 days'`
    );

    // Un-stick items left in 'processing' by a crashed/timed-out batch so
    // they can be picked up again instead of leaking.
    const stuckResult = await pool.query(
      `UPDATE feed_items SET status = 'pending'
       WHERE status = 'processing' AND created_at < NOW() - INTERVAL '2 hours'`
    );

    // Delete old pipeline runs (keep 30 days)
    const runsResult = await pool.query(
      `DELETE FROM pipeline_runs
       WHERE started_at < NOW() - INTERVAL '30 days'`
    );

    // Analytics rows are written on every non-bot page view and had no
    // retention at all. The dashboard only ever reads the last 30 days.
    const viewsResult = await pool.query(
      `DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '60 days'`
    );

    // Facebook posting history grows one row per attempt, including errors.
    const fbResult = await pool.query(
      `DELETE FROM facebook_posts WHERE posted_at < NOW() - INTERVAL '90 days'`
    );

    const feedDeleted = feedResult.rowCount ?? 0;
    const runsDeleted = runsResult.rowCount ?? 0;
    const viewsDeleted = viewsResult.rowCount ?? 0;
    const fbDeleted = fbResult.rowCount ?? 0;
    const unstuck = stuckResult.rowCount ?? 0;

    await logRunEnd(
      runId,
      feedDeleted + runsDeleted + viewsDeleted + fbDeleted,
      0,
      Date.now() - startTime
    );

    return NextResponse.json({
      feedItemsDeleted: feedDeleted,
      stuckItemsReset: unstuck,
      pipelineRunsDeleted: runsDeleted,
      pageViewsDeleted: viewsDeleted,
      facebookPostsDeleted: fbDeleted,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime, String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
