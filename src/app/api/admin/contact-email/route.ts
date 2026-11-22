import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getZoneMap, forwardContactAddress } from "@/lib/cloudflare";

/**
 * Forward contact@{domain} on every site to the newsroom inbox.
 *   GET /api/admin/contact-email?key=CRON_SECRET&apply=1[&only=domain]
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const NEWSROOM_INBOX = process.env.CONTACT_FORWARD_TO || "ainewss2023@gmail.com";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (req.nextUrl.searchParams.get("apply") !== "1") return NextResponse.json({ to: NEWSROOM_INBOX, hint: "add &apply=1" });
  const only = req.nextUrl.searchParams.get("only");
  const zones = await getZoneMap();
  const out: Record<string, unknown> = {};
  for (const s of Object.values(sites)) {
    if (only && s.domain !== only) continue;
    const id = zones.get(s.domain);
    out[s.domain] = id ? await forwardContactAddress(id, s.domain, NEWSROOM_INBOX) : "no zone";
  }
  return NextResponse.json({ to: NEWSROOM_INBOX, zones: out });
}
