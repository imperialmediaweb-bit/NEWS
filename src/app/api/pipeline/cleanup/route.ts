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
    // Delete old feed items (keep 7 days)
    const feedResult = await pool.query(
      `DELETE FROM feed_items
       WHERE created_at < NOW() - INTERVAL '7 days'
       AND status IN ('rewritten', 'failed', 'skipped')`
    );

    // Delete old pipeline runs (keep 30 days)
    const runsResult = await pool.query(
      `DELETE FROM pipeline_runs
       WHERE started_at < NOW() - INTERVAL '30 days'`
    );

    const feedDeleted = feedResult.rowCount ?? 0;
    const runsDeleted = runsResult.rowCount ?? 0;

    await logRunEnd(runId, feedDeleted + runsDeleted, 0, Date.now() - startTime);

    return NextResponse.json({
      feedItemsDeleted: feedDeleted,
      pipelineRunsDeleted: runsDeleted,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime, String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
