import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { dirSchema, queueImports, importTick } from "@/lib/directory";

/**
 * Queue OpenStreetMap imports: GET ?states=TX,FL,CA (worked through one state
 * at a time by the cron, resuming after redeploys). GET without states: progress.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dirSchema();
  // ?welcome=<business slug>&site=<site slug>: (re)send the owner welcome email
  const welcome = req.nextUrl.searchParams.get("welcome");
  if (welcome) {
    const { sendOwnerWelcome } = await import("@/lib/directory-owner");
    const { rows: w } = await pool.query(`SELECT id, site_slug FROM businesses WHERE slug = $1 AND site_slug = $2`, [welcome, req.nextUrl.searchParams.get("site") || ""]);
    return NextResponse.json({ sent: w[0] ? await sendOwnerWelcome(w[0].site_slug, w[0].id) : false });
  }
  const list = (req.nextUrl.searchParams.get("states") || req.nextUrl.searchParams.get("state") || "").toUpperCase().split(",").map((s) => s.trim()).filter((s) => /^[A-Z]{2}$/.test(s));
  if (list.length) {
    await queueImports(list);
    return NextResponse.json({ queued: list, started: await importTick() });
  }
  const { rows } = await pool.query(`SELECT * FROM directory_imports ORDER BY started_at DESC`);
  const { rows: tot } = await pool.query(`SELECT site_slug, COUNT(*)::int n FROM businesses GROUP BY site_slug ORDER BY n DESC`);
  return NextResponse.json({ imports: rows, totals: tot });
}
