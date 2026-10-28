import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * What the posting job actually recorded, and when.
 *
 *   GET /api/admin/fb-log?key=CRON_SECRET&limit=40
 *
 * The owner reports seeing nothing new on the Pages while the job reports
 * "hourly quota reached" for every one of them — which it only says when
 * facebook_posts holds a successful row from the last hour. Both cannot be
 * true, and nothing in the system showed which it was: the job reports what
 * it decided, not what it wrote.
 *
 * This returns the rows themselves — page, time, Facebook's own post id, and
 * the error when there was one. A recent id that opens on Facebook means the
 * job works and the Pages are being looked at in the wrong place; a recent id
 * that does not open means Facebook accepted the write and is not showing it,
 * which is a Page problem, not a code one.
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    200,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "40", 10) || 40)
  );

  try {
    const { rows } = await query(
      `SELECT p.page_id, p.status, p.posted_at, p.fb_post_id, p.error,
              f.page_name, f.site_slug
         FROM facebook_posts p
         LEFT JOIN facebook_pages f ON f.page_id = p.page_id
        ORDER BY p.posted_at DESC
        LIMIT $1`,
      [limit]
    );

    const { rows: counts } = await query(
      `SELECT
         count(*) FILTER (WHERE posted_at >= NOW() - INTERVAL '1 hour')::int  AS last_hour,
         count(*) FILTER (WHERE posted_at >= NOW() - INTERVAL '24 hours')::int AS last_24h,
         count(*) FILTER (WHERE status = 'success'
                            AND posted_at >= NOW() - INTERVAL '24 hours')::int AS ok_24h,
         max(posted_at) AS newest
       FROM facebook_posts`
    );

    return NextResponse.json({
      totals: counts[0] || {},
      posts: rows.map((r) => ({
        page: r.page_name || r.page_id,
        site: r.site_slug,
        status: r.status,
        at: r.posted_at,
        url: r.fb_post_id ? `https://facebook.com/${r.fb_post_id}` : null,
        error: r.error ? String(r.error).slice(0, 200) : null,
      })),
    });
  } catch (e) {
    // The column names are the ones the posting job writes; if they differ
    // this says so instead of returning an empty list that reads as "nothing
    // was ever posted".
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
