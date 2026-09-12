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
    sites,
  });
}
