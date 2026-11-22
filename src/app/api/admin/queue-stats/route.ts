import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Per state, the last 24 hours of the news pipeline: published, still queued,
 * failed, and the most common failure reasons.
 *   GET /api/admin/queue-stats?key=CRON_SECRET
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows: perState } = await pool.query(
    `SELECT s.state,
            (SELECT count(*)::int FROM articles a WHERE a.site_id = s.id AND a.published_at > now() - interval '24 hours') AS published24h,
            (SELECT count(*)::int FROM feed_items f WHERE f.state = s.state AND f.status = 'pending') AS pending,
            (SELECT count(*)::int FROM feed_items f WHERE f.state = s.state AND f.status = 'failed' AND f.created_at > now() - interval '24 hours') AS failed24h,
            (SELECT count(*)::int FROM feed_items f WHERE f.state = s.state AND f.created_at > now() - interval '24 hours') AS queued24h
       FROM sites s ORDER BY published24h ASC`
  );
  const { rows: reasons } = await pool.query(
    `SELECT left(regexp_replace(coalesce(error_message, '?'), '[0-9]+', 'N', 'g'), 90) AS reason, count(*)::int AS n
       FROM feed_items WHERE status = 'failed' AND created_at > now() - interval '24 hours'
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12`
  );
  return NextResponse.json({ perState, reasons });
}
