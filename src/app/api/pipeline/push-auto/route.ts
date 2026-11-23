import { NextRequest, NextResponse } from "next/server";
import { autoPush } from "@/lib/push";

/** Cron: send the automatic story notifications (see src/lib/push.ts for the limits). */
export const dynamic = "force-dynamic";
export const maxDuration = 120;
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ sent: await autoPush() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
