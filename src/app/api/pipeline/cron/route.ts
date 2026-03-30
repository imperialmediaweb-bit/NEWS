import { NextRequest, NextResponse } from "next/server";
import { isPublishingHours } from "@/config/feeds";
import { isPipelineEnabled } from "@/lib/pipeline/scheduler";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/**
 * Unified cron endpoint — orchestrates the entire pipeline.
 * Call this every 5 minutes from a single external trigger.
 *
 * It checks what needs to run and calls the appropriate internal endpoints:
 * - Fetch RSS: rotates through batches 0-4, every 2h per batch
 * - Rewrite: every 15 minutes during publishing hours
 * - IndexNow + Google Ping: every 2 hours
 * - Opinion: every 12 hours
 * - Cleanup: once per day at 3 AM UTC
 */
export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPipelineEnabled())) {
    return NextResponse.json({ message: "Pipeline disabled" });
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const results: Record<string, unknown> = {};
  const baseUrl = getBaseUrl(req);
  const secret = process.env.CRON_SECRET || "";

  // ─── Fetch RSS: rotate batches, every 2h ───
  // Each batch runs at a different minute offset within the 2h window
  if (isPublishingHours()) {
    // Determine which batch to run based on current time
    // Every 2h cycle, run batches at minute 0, 10, 20, 30, 40
    const batchMinutes = [0, 10, 20, 30, 40];

    for (let b = 0; b < 5; b++) {
      // Run batch if we're within 5 min of its scheduled minute
      if (Math.abs(utcMinute - batchMinutes[b]) <= 4) {
        // Check if this batch was already fetched recently (last 90 min)
        const lastFetch = await getLastRun(`fetch-batch-${b}`);
        if (!lastFetch || minutesAgo(lastFetch) >= 90) {
          results[`fetch_batch_${b}`] = await callEndpoint(
            baseUrl,
            "pipeline/fetch",
            { batch: b },
            secret
          );
        } else {
          results[`fetch_batch_${b}`] = "skipped (ran recently)";
        }
      }
    }

    // ─── Rewrite: every 15 min during publishing hours ───
    if (utcMinute % 15 <= 4) {
      const lastRewrite = await getLastRun("rewrite");
      if (!lastRewrite || minutesAgo(lastRewrite) >= 10) {
        results.rewrite = await callEndpoint(
          baseUrl,
          "pipeline/rewrite",
          { batchSize: 10 },
          secret
        );
      } else {
        results.rewrite = "skipped (ran recently)";
      }
    }
  } else {
    results.publishing_hours = "outside publishing hours (6AM-10PM ET)";
  }

  // ─── IndexNow + Google Ping: every 2h ───
  if (utcMinute >= 45 && utcMinute <= 49) {
    const lastNotify = await getLastRun("indexnow");
    if (!lastNotify || minutesAgo(lastNotify) >= 90) {
      results.notify = await callEndpoint(
        baseUrl,
        "pipeline/notify",
        {},
        secret
      );
    }
  }

  // ─── Opinion: every 12h (at 8 AM and 8 PM UTC) ───
  if ((utcHour === 8 || utcHour === 20) && utcMinute <= 4) {
    const lastOpinion = await getLastRun("opinion");
    if (!lastOpinion || minutesAgo(lastOpinion) >= 600) {
      results.opinion = await callEndpoint(
        baseUrl,
        "pipeline/opinion",
        {},
        secret
      );
    }
  }

  // ─── Cleanup: daily at 3 AM UTC ───
  if (utcHour === 3 && utcMinute <= 4) {
    const lastCleanup = await getLastRun("cleanup");
    if (!lastCleanup || minutesAgo(lastCleanup) >= 1200) {
      results.cleanup = await callEndpoint(
        baseUrl,
        "pipeline/cleanup",
        {},
        secret
      );
    }
  }

  // If nothing ran this cycle
  if (Object.keys(results).length === 0) {
    results.status = "nothing due this cycle";
  }

  return NextResponse.json({
    time: now.toISOString(),
    utcHour,
    utcMinute,
    publishingHours: isPublishingHours(),
    results,
  });
}

// Also support GET for simple cron services that only do GET
export async function GET(req: NextRequest) {
  return POST(req);
}

/**
 * Get base URL from the request
 */
function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Call an internal pipeline endpoint
 */
async function callEndpoint(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  secret: string
): Promise<unknown> {
  try {
    const res = await fetch(`${baseUrl}/api/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (error) {
    return { error: String(error) };
  }
}

/**
 * Get the last completed_at time for a pipeline stage
 */
async function getLastRun(stage: string): Promise<Date | null> {
  try {
    const pool = (await import("@/lib/db")).default;
    const { rows } = await pool.query(
      `SELECT completed_at FROM pipeline_runs
       WHERE stage = $1 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC LIMIT 1`,
      [stage]
    );
    return rows.length > 0 ? new Date(rows[0].completed_at) : null;
  } catch {
    return null;
  }
}

/**
 * How many minutes ago was this date
 */
function minutesAgo(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60);
}
