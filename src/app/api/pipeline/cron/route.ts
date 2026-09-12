import { NextRequest, NextResponse } from "next/server";
import { isPublishingHours, STATE_BATCHES } from "@/config/feeds";
import { isPipelineEnabled } from "@/lib/pipeline/scheduler";
import { claimJob } from "@/lib/pipeline/jobs";
import { hasCloudflareCredentials } from "@/lib/cloudflare";
import { hasGscCredentials } from "@/lib/gsc";

/**
 * 5 batches × 24 minutes = every state group is fetched once every 2 hours,
 * matching the old cadence.
 */
const FETCH_INTERVAL_SECONDS = 24 * 60;

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
  const actions: string[] = [];
  const baseUrl = getBaseUrl(req);
  const secret = process.env.CRON_SECRET || "";

  // Manual test override: runs fetch+rewrite immediately, ignoring both the
  // publishing-hours window and the job intervals. Lets you verify the
  // pipeline from a browser. ?force=1 uses batch 0; ?force=3 uses batch 3.
  const forceParam = req.nextUrl.searchParams.get("force");
  if (forceParam) {
    const batch = Math.min(4, Math.max(0, parseInt(forceParam, 10) || 0));
    fireAndForget(baseUrl, "pipeline/fetch", { batch }, secret);
    fireAndForget(baseUrl, "pipeline/rewrite", { batchSize: 10 }, secret);
    return NextResponse.json({
      ok: true,
      forced: true,
      time: now.toISOString(),
      triggered: [`fetch_batch_${batch}`, "rewrite"],
      note: "Forced fetch+rewrite dispatched. Check article count in ~1-2 min.",
    });
  }

  if (isPublishingHours()) {
    // ─── Fetch RSS: one batch at a time, rotating ───
    // Each claim advances to the next batch, so all five states groups get
    // their turn no matter what minute the trigger happens to fire on. Five
    // batches at 24 minutes apart means each batch is fetched every 2 hours,
    // the same cadence as before.
    const fetchClaim = await claimJob("fetch", FETCH_INTERVAL_SECONDS);
    if (fetchClaim.claimed) {
      const batchIndex = fetchClaim.runCount % STATE_BATCHES.length;
      // How many full rotations we've done — used to advance the starting
      // state inside the batch, so a run that runs out of time doesn't skip
      // the same tail every time.
      const rotate = Math.floor(fetchClaim.runCount / STATE_BATCHES.length);
      fireAndForget(baseUrl, "pipeline/fetch", { batch: batchIndex, rotate }, secret);
      actions.push(`fetch_batch_${batchIndex}`);
    }

    // ─── Rewrite: every 15 min ───
    if ((await claimJob("rewrite", 15 * 60)).claimed) {
      fireAndForget(baseUrl, "pipeline/rewrite", { batchSize: 10 }, secret);
      actions.push("rewrite");
    }
  } else {
    actions.push("outside_publishing_hours");
  }

  // ─── IndexNow + search engine submission: every 2h ───
  if ((await claimJob("notify", 2 * 60 * 60)).claimed) {
    fireAndForget(baseUrl, "pipeline/notify", {}, secret);
    actions.push("notify");
  }

  // ─── Opinion: every 12h ───
  if ((await claimJob("opinion", 12 * 60 * 60)).claimed) {
    fireAndForget(baseUrl, "pipeline/opinion", {}, secret);
    actions.push("opinion");
  }

  // ─── Cleanup: daily ───
  if ((await claimJob("cleanup", 24 * 60 * 60)).claimed) {
    fireAndForget(baseUrl, "pipeline/cleanup", {}, secret);
    actions.push("cleanup");
  }

  // ─── Submit sitemaps to Google & Bing: daily ───
  if ((await claimJob("submit_sitemaps", 24 * 60 * 60)).claimed) {
    fireAndForget(baseUrl, "admin/submit-sitemaps", {}, secret);
    actions.push("submit_sitemaps");
  }

  // ─── Search Console property setup: hourly until every site is done ───
  // Self-healing: a site whose DNS had not propagated yet is retried on the
  // next pass, and once all 50 have a usable domain property this is a no-op.
  //
  // Check the credentials *before* claiming. The app runs as several service
  // copies and any of them can win the claim; one that lacks the variables
  // would take the claim, skip the work, and block the copy that does have
  // them for the next hour.
  if (hasCloudflareCredentials() && hasGscCredentials() && (await claimJob("gsc_setup", 60 * 60)).claimed) {
    fireAndForget(baseUrl, "admin/gsc-setup?step=auto", {}, secret);
    actions.push("gsc_setup");
  }

  // ─── Database indexes: daily, idempotent (CREATE INDEX IF NOT EXISTS) ───
  // Cheap when there is nothing to do, and means a new index added to the code
  // gets applied without anyone remembering to run it.
  if ((await claimJob("optimize_db", 24 * 60 * 60)).claimed) {
    fireAndForget(baseUrl, "admin/optimize-db", {}, secret);
    actions.push("optimize_db");
  }

  if (actions.length === 0) {
    actions.push("nothing_due");
  }

  return NextResponse.json({
    ok: true,
    time: now.toISOString(),
    publishingHours: isPublishingHours(),
    triggered: actions,
  });
}

// Also support GET for simple cron services
export async function GET(req: NextRequest) {
  return POST(req);
}

function getBaseUrl(req: NextRequest): string {
  // Dispatch pipeline stages to ourselves over loopback. Using the public
  // hostname sent every internal call out through Cloudflare and back —
  // billable egress + ingress + a TLS handshake for a same-process call.
  void req;
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
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
