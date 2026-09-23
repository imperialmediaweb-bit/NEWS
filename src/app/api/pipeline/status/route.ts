import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { listJobs } from "@/lib/pipeline/jobs";
import { isPipelineEnabled } from "@/lib/pipeline/scheduler";
import { isPublishingHours, STATE_BATCHES } from "@/config/feeds";
import { sites as siteConfigs } from "@/config/sites";
import { hasCloudflareCredentials } from "@/lib/cloudflare";
import { hasGscCredentials, getGscToken, listProperties, hasUsableDomainProperty } from "@/lib/gsc";

/**
 * How far along the Search Console setup is. The hourly gsc_setup job drives
 * this to 50/50 on its own; this is the number to watch rather than clicking
 * through 50 properties by hand.
 */
async function searchConsoleSummary(): Promise<Record<string, unknown>> {
  if (!hasGscCredentials()) {
    return { ready: false, reason: "No Google service-account credentials" };
  }
  if (!hasCloudflareCredentials()) {
    return {
      ready: false,
      reason: "No Cloudflare credentials — set CLOUDFLARE_API_TOKEN so DNS verification can run",
    };
  }

  try {
    const properties = await listProperties(await getGscToken());
    const all = Object.values(siteConfigs);
    const pending = all
      .filter((s) => !hasUsableDomainProperty(properties.get(s.domain.toLowerCase())))
      .map((s) => s.slug);

    return {
      ready: true,
      owner: process.env.GSC_OWNER_EMAIL || null,
      ...(!process.env.GSC_OWNER_EMAIL && {
        warning:
          "GSC_OWNER_EMAIL is not set, so properties stay owned by the service account and never appear in a person's Search Console.",
      }),
      configured: all.length - pending.length,
      total: all.length,
      pending,
    };
  } catch (e) {
    return { ready: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export const dynamic = "force-dynamic";

/**
 * One place to answer "is the pipeline actually running, and for which states?"
 *
 *   GET /api/pipeline/status?key=CRON_SECRET
 *
 * Shows when each job last ran, and how many articles each site published in
 * the last 24 and 48 hours — which is what exposed that a whole batch of
 * states had quietly stopped publishing while the rest of the network looked
 * healthy.
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await listJobs();

  let sites: { slug: string; last24h: number; last48h: number; newest: string | null }[] = [];
  try {
    const { rows } = await pool.query(
      `SELECT s.slug,
              count(*) FILTER (WHERE a.published_at > NOW() - INTERVAL '24 hours')::int AS last24h,
              count(*) FILTER (WHERE a.published_at > NOW() - INTERVAL '48 hours')::int AS last48h,
              max(a.published_at) AS newest
         FROM sites s
         LEFT JOIN articles a ON a.site_id = s.id
        GROUP BY s.slug
        ORDER BY s.slug`
    );
    sites = rows.map((r) => ({
      slug: r.slug as string,
      last24h: Number(r.last24h),
      last48h: Number(r.last48h),
      newest: r.newest ? new Date(r.newest).toISOString() : null,
    }));
  } catch (e) {
    return NextResponse.json(
      { error: "Site query failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  const silent = sites.filter((s) => s.last48h === 0).map((s) => s.slug);
  const fetchJob = jobs.find((j) => j.job === "fetch");

  // For anything still silent, say *where* it is stuck rather than leaving it
  // to be worked out by hand. Items waiting in feed_items means fetching works
  // and rewriting is behind; nothing waiting and an old fetch means the state
  // is not being fetched at all; nothing waiting and a recent fetch means the
  // source feed returned nothing worth keeping.
  const diagnosis: Record<string, unknown>[] = [];
  if (silent.length > 0) {
    const silentStates = Object.values(siteConfigs)
      .filter((s) => silent.includes(s.slug))
      .map((s) => s.state);
    try {
      // Scalar subqueries, not two LEFT JOINs on the same key: joining
      // feed_items and pipeline_runs together multiplies the rows, and the
      // counts come back as pending × matching-runs. That inflated Florida's
      // backlog to 36,045 in an earlier version of this endpoint.
      const { rows } = await pool.query(
        `SELECT s.state,
                (SELECT count(*)::int FROM feed_items f
                  WHERE f.state = s.state AND f.status = 'pending')    AS pending,
                (SELECT count(*)::int FROM feed_items f
                  WHERE f.state = s.state AND f.status = 'processing') AS processing,
                (SELECT count(*)::int FROM feed_items f
                  WHERE f.state = s.state AND f.status = 'failed')     AS failed,
                (SELECT max(f.created_at) FROM feed_items f
                  WHERE f.state = s.state)                             AS newest_item,
                (SELECT max(r.completed_at) FROM pipeline_runs r
                  WHERE r.category = s.state AND r.stage = 'fetch'
                    AND r.error_message IS NULL)                       AS last_fetch_ok,
                -- The reason the most recent failure failed. Without this a
                -- failed count says only that something is wrong, and the
                -- answer sits in the table unread.
                (SELECT f.error_message FROM feed_items f
                  WHERE f.state = s.state AND f.status = 'failed'
                    AND f.error_message IS NOT NULL
                  ORDER BY f.created_at DESC LIMIT 1)                  AS last_error
           FROM unnest($1::text[]) AS s(state)`,
        [silentStates]
      );
      for (const r of rows) {
        const pending = Number(r.pending);
        const lastFetch = r.last_fetch_ok ? new Date(r.last_fetch_ok) : null;
        const fetchedRecently =
          lastFetch !== null && Date.now() - lastFetch.getTime() < 3 * 60 * 60 * 1000;
        diagnosis.push({
          state: r.state,
          pending,
          processing: Number(r.processing),
          failed: Number(r.failed),
          lastError: r.last_error || null,
          newestItem: r.newest_item ? new Date(r.newest_item).toISOString() : null,
          lastFetchOk: lastFetch ? lastFetch.toISOString() : null,
          likelyCause:
            pending > 0
              ? "items are queued — the rewrite stage is behind, not the fetch"
              : fetchedRecently
                ? "fetched recently but nothing queued — the source feed returned only duplicates or nothing"
                : "not being fetched — check that its batch is reaching this state",
        });
      }
    } catch (e) {
      diagnosis.push({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({
    pipelineEnabled: await isPipelineEnabled(),
    publishingHours: isPublishingHours(),
    nextFetchBatch: fetchJob ? fetchJob.runCount % STATE_BATCHES.length : 0,
    searchConsole: await searchConsoleSummary(),
    jobs,
    totals: {
      sites: sites.length,
      publishedLast24h: sites.reduce((n, s) => n + s.last24h, 0),
      sitesSilent48h: silent.length,
    },
    silent48h: silent,
    // Why each silent site is silent, so this needs no follow-up detective work.
    whySilent: diagnosis.length > 0 ? diagnosis : undefined,
    sites,
  });
}
