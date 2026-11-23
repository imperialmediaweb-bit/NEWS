import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { importState, dirSchema } from "@/lib/directory";

/**
 * Start a state's OpenStreetMap import in the background: GET ?state=TX (or
 * ?states=TX,FL,CA, one after another). GET without a state: progress.
 */
export const dynamic = "force-dynamic";
let running: Promise<unknown> | null = null;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dirSchema();
  const list = (req.nextUrl.searchParams.get("states") || req.nextUrl.searchParams.get("state") || "").toUpperCase().split(",").map((s) => s.trim()).filter((s) => /^[A-Z]{2}$/.test(s));
  if (list.length) {
    if (running) return NextResponse.json({ error: "An import is already running" }, { status: 409 });
    running = (async () => { for (const s of list) await importState(s).catch((e) => console.error("directory import", s, e)); })().finally(() => { running = null; });
    return NextResponse.json({ started: list });
  }
  const { rows } = await pool.query(`SELECT * FROM directory_imports ORDER BY started_at DESC`);
  const { rows: tot } = await pool.query(`SELECT site_slug, COUNT(*)::int n FROM businesses GROUP BY site_slug ORDER BY n DESC`);
  return NextResponse.json({ running: !!running, imports: rows, totals: tot });
}
