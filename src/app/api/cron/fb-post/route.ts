import { NextRequest, NextResponse } from "next/server";
import { runAllSites } from "@/lib/autoposter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const bearer = header.replace(/^Bearer\s+/i, "");
  const query = req.nextUrl.searchParams.get("secret") || "";
  return bearer === secret || query === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const started = Date.now();
  const results = await runAllSites();
  const summary = results.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    {} as Record<string, number>
  );
  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    sites_processed: results.length,
    summary,
    results,
  });
}

export const GET = handle;
export const POST = handle;
