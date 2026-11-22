import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Facebook posting by day: how many went out, how many failed and why, so a
 * suspension can be traced to when it started and what preceded it.
 *   GET /api/admin/fb-history?key=CRON_SECRET
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows: byDay } = await pool.query(
    `SELECT to_char(date_trunc('day', posted_at), 'YYYY-MM-DD') AS day,
            count(*)::int AS total,
            count(*) FILTER (WHERE status <> 'error')::int AS ok,
            count(DISTINCT page_id)::int AS pages
       FROM facebook_posts GROUP BY 1 ORDER BY 1`
  );
  const { rows: firstErrors } = await pool.query(
    `SELECT posted_at, left(coalesce(error, ''), 220) AS error
       FROM facebook_posts WHERE status = 'error' ORDER BY posted_at ASC LIMIT 8`
  );
  return NextResponse.json({ byDay, firstErrors });
}
