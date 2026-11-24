import { NextRequest, NextResponse } from "next/server";
import { serviceArticlesTick, serviceArticleFor } from "@/lib/service-articles";

/** Cron: the daily "Guides" article for papers that are due (?site=slug writes one now for that paper). */
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const one = req.nextUrl.searchParams.get("site");
  if (one) return NextResponse.json({ site: one, article: await serviceArticleFor(one) });
  return NextResponse.json({ done: await serviceArticlesTick(3) });
}
