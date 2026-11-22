import { NextRequest, NextResponse } from "next/server";
import { getZoneMap, purgeEverything, hasCloudflareCredentials } from "@/lib/cloudflare";
import { sites } from "@/config/sites";

/**
 * Empty the Cloudflare cache of every network site, so a redesign switched on
 * with DESIGN_NOU reaches visitors at once instead of after the edge TTL.
 *   GET /api/admin/purge-all?key=CRON_SECRET
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasCloudflareCredentials()) return NextResponse.json({ error: "Cloudflare credentials not set" }, { status: 500 });
  const zones = await getZoneMap();
  const results: Array<{ domain: string; ok: boolean; error?: string }> = [];
  for (const site of Object.values(sites)) {
    const domain = site.domain.toLowerCase().replace(/^www\./, "");
    const zoneId = zones.get(domain);
    if (!zoneId) {
      results.push({ domain, ok: false, error: "zone not found" });
      continue;
    }
    results.push({ domain, ...(await purgeEverything(zoneId)) });
  }
  return NextResponse.json({ purged: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok) });
}
