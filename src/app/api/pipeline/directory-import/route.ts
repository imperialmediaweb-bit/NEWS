import { NextRequest, NextResponse } from "next/server";
import { importTick } from "@/lib/directory";

/** Cron: keep the directory import queue moving (resumes after redeploys). */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ started: await importTick() });
}
