import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getZoneMap, setupReleaseInbox } from "@/lib/cloudflare";

/**
 * Set up releases@{domain} on every site: Email Routing to the inbound Email
 * Worker, which POSTs each message to /api/pipeline/inbound-email.
 *   GET /api/admin/release-inbox?key=CRON_SECRET&apply=1[&only=domain]
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (req.nextUrl.searchParams.get("apply") !== "1") return NextResponse.json({ hint: "add &apply=1" });
  const endpoint = process.env.INBOUND_ENDPOINT || "https://news-production-dd80.up.railway.app/api/pipeline/inbound-email";
  const only = req.nextUrl.searchParams.get("only");
  const zones = await getZoneMap();
  const deployed = new Set<string>();
  const out: Record<string, unknown> = {};
  for (const s of Object.values(sites)) {
    if (only && s.domain !== only) continue;
    const id = zones.get(s.domain);
    out[s.domain] = id ? await setupReleaseInbox(id, s.domain, endpoint, process.env.CRON_SECRET, deployed) : "no zone";
  }
  return NextResponse.json({ endpoint, zones: out });
}
