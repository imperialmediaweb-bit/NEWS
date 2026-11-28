import { NextRequest, NextResponse } from "next/server";
import { rejectSender } from "@/lib/reject-sender";

/** Reject every listing from one sender: GET ?name=Full Name[&keep_first=1][&notify=1]. Admin key required. */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = (req.nextUrl.searchParams.get("name") || "").trim();
  if (name.length < 4) return NextResponse.json({ error: "name required" }, { status: 400 });
  return NextResponse.json(await rejectSender(name, { keepFirst: req.nextUrl.searchParams.get("keep_first") === "1", notify: req.nextUrl.searchParams.get("notify") === "1" }));
}
