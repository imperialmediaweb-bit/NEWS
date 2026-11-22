import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getZoneMap, openZoneToAnswerBots } from "@/lib/cloudflare";

/**
 * Open every zone to AI answer engines (see openZoneToAnswerBots).
 *   GET /api/admin/ai-bots?key=CRON_SECRET           (read current settings)
 *   GET /api/admin/ai-bots?key=CRON_SECRET&apply=1   (change them)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apply = req.nextUrl.searchParams.get("apply") === "1";
  const zones = await getZoneMap();
  const out: Record<string, unknown> = {};
  for (const s of Object.values(sites)) {
    const id = zones.get(s.domain);
    out[s.domain] = id ? await openZoneToAnswerBots(id, apply) : "no zone";
  }
  return NextResponse.json({ apply, zones: out });
}
