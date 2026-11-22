import { NextResponse } from "next/server";
import { LEGACY_INDEXNOW_KEY } from "@/lib/indexnow";

/** Key file for the legacy IndexNow key, which Bing still binds some hosts to. */
export function GET() {
  return new NextResponse(LEGACY_INDEXNOW_KEY, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
