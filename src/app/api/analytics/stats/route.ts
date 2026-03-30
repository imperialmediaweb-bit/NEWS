import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function authCheck(req: NextRequest): boolean {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return key === process.env.CRON_SECRET;
}

/**
 * Analytics stats endpoint.
 * Returns traffic data per site, top pages, referrers, trends.
 */
export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Views per site today
    const { rows: sitesToday } = await pool.query(`
      SELECT s.name, s.domain, s.state, COUNT(pv.id)::int as views_today
      FROM sites s
      LEFT JOIN page_views pv ON pv.site_id = s.id AND pv.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY s.id, s.name, s.domain, s.state
      ORDER BY views_today DESC
      LIMIT 50
    `);

    // Views per site this week
    const { rows: sitesWeek } = await pool.query(`
      SELECT s.name, s.domain, COUNT(pv.id)::int as views_week
      FROM sites s
      LEFT JOIN page_views pv ON pv.site_id = s.id AND pv.created_at > NOW() - INTERVAL '7 days'
      GROUP BY s.id, s.name, s.domain
      ORDER BY views_week DESC
      LIMIT 50
    `);

    // Total views today / this week / this month
    const { rows: totals } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int as today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int as week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int as month
      FROM page_views
    `);

    // Top pages today (all sites)
    const { rows: topPages } = await pool.query(`
      SELECT pv.path, pv.title, s.domain, COUNT(*)::int as views
      FROM page_views pv
      LEFT JOIN sites s ON pv.site_id = s.id
      WHERE pv.created_at > NOW() - INTERVAL '24 hours'
      GROUP BY pv.path, pv.title, s.domain
      ORDER BY views DESC
      LIMIT 20
    `);

    // Top referrers today
    const { rows: topReferrers } = await pool.query(`
      SELECT
        CASE
          WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
          ELSE substring(referrer from '://([^/]+)')
        END as source,
        COUNT(*)::int as views
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
      ORDER BY views DESC
      LIMIT 15
    `);

    // Hourly trend (last 24h)
    const { rows: hourlyTrend } = await pool.query(`
      SELECT
        date_trunc('hour', created_at) as hour,
        COUNT(*)::int as views
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `);

    return NextResponse.json({
      totals: totals[0] || { today: 0, week: 0, month: 0 },
      sitesToday,
      sitesWeek,
      topPages,
      topReferrers,
      hourlyTrend,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
