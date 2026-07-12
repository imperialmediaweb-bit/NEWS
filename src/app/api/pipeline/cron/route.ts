import { NextRequest, NextResponse } from "next/server";
import { isPublishingHours } from "@/config/feeds";
import { isPipelineEnabled } from "@/lib/pipeline/scheduler";

function authCheck(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key");
  return token === process.env.CRON_SECRET;
}

/**
 * Unified cron endpoint — orchestrates the entire pipeline.
 * Call every 5 minutes from a single external trigger.
 *
 * IMPORTANT: Uses fire-and-forget for long-running tasks (fetch/rewrite)
 * so the response returns fast (under 5s) and cron-job.org doesn't timeout.
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
  const actions: string[] = [];
  const baseUrl = getBaseUrl(req);
  const secret = process.env.CRON_SECRET || "";

  // Manual test override: ?force=1 runs fetch+rewrite immediately, ignoring
  // the publishing-hours window. Lets you verify the pipeline from a browser.
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (force) {
    fireAndForget(baseUrl, "pipeline/fetch", { batch: 0 }, secret);
    fireAndForget(baseUrl, "pipeline/rewrite", { batchSize: 10 }, secret);
    return NextResponse.json({
      ok: true,
      forced: true,
      time: now.toISOString(),
      triggered: ["fetch_batch_0", "rewrite"],
      note: "Forced fetch+rewrite dispatched. Check article count in ~1-2 min.",
    });
  }

  if (isPublishingHours()) {
    // ─── Fetch RSS: 1 batch per 5-min cycle, rotating ───
    // Minute 0-4 → batch 0, 5-9 → batch 1, 10-14 → batch 2, etc.
    // Every hour covers all 5 batches. Every 2h each batch runs twice.
    const batchIndex = Math.floor(utcMinute / 5) % 5;

    // Only fetch on even hours (every 2h)
    if (utcHour % 2 === 0 && utcMinute < 25) {
      fireAndForget(baseUrl, "pipeline/fetch", { batch: batchIndex }, secret);
      actions.push(`fetch_batch_${batchIndex}`);
    }

    // ─── Rewrite: every 15 min ───
    if (utcMinute % 15 < 5) {
      fireAndForget(baseUrl, "pipeline/rewrite", { batchSize: 10 }, secret);
      actions.push("rewrite");
    }
  } else {
    actions.push("outside_publishing_hours");
  }

  // ─── IndexNow + Google Ping: every 2h ───
  if (utcHour % 2 === 0 && utcMinute >= 50 && utcMinute < 55) {
    fireAndForget(baseUrl, "pipeline/notify", {}, secret);
    actions.push("notify");
  }

  // ─── Opinion: every 12h (8 AM and 8 PM UTC) ───
  if ((utcHour === 8 || utcHour === 20) && utcMinute < 5) {
    fireAndForget(baseUrl, "pipeline/opinion", {}, secret);
    actions.push("opinion");
  }

  // ─── Cleanup: daily at 3 AM UTC ───
  if (utcHour === 3 && utcMinute < 5) {
    fireAndForget(baseUrl, "pipeline/cleanup", {}, secret);
    actions.push("cleanup");
  }

  // ─── Submit sitemaps to Google & Bing: daily at 6 AM UTC ───
  if (utcHour === 6 && utcMinute < 5) {
    fireAndForget(baseUrl, "admin/submit-sitemaps", {}, secret);
    actions.push("submit_sitemaps");
  }

  if (actions.length === 0) {
    actions.push("nothing_due");
  }

  return NextResponse.json({
    ok: true,
    time: now.toISOString(),
    utcHour,
    utcMinute,
    publishingHours: isPublishingHours(),
    triggered: actions,
  });
}

// Also support GET for simple cron services
export async function GET(req: NextRequest) {
  return POST(req);
}

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Fire and forget — send request but don't wait for response.
 * This ensures the cron endpoint returns fast (< 5s).
 */
function fireAndForget(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  secret: string
): void {
  fetch(`${baseUrl}/api/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error(`Fire-and-forget failed for ${path}:`, err);
  });
}
