import { NextRequest, NextResponse } from "next/server";
import { ensurePaidTable } from "@/lib/paid";
import { autoPublishSpotlights } from "@/lib/paid-publish";

/** Cron: publish Business Spotlight profiles 24 hours after payment (unless declined in /admin/paid). */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePaidTable();
  return NextResponse.json({ published: await autoPublishSpotlights() });
}
