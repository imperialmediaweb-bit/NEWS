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

    // Top pages from search engines (Google, Bing, Yahoo)
    const { rows: searchPages } = await pool.query(`
      SELECT pv.path, pv.title, s.domain,
        substring(pv.referrer from '://([^/]+)') as search_engine,
        COUNT(*)::int as views
      FROM page_views pv
      LEFT JOIN sites s ON pv.site_id = s.id
      WHERE pv.created_at > NOW() - INTERVAL '7 days'
        AND (pv.referrer ILIKE '%google.%' OR pv.referrer ILIKE '%bing.%' OR pv.referrer ILIKE '%yahoo.%' OR pv.referrer ILIKE '%duckduckgo.%')
      GROUP BY pv.path, pv.title, s.domain, search_engine
      ORDER BY views DESC
      LIMIT 30
    `);

    // Top user agents (to spot bots)
    const { rows: topUserAgents } = await pool.query(`
      SELECT
        CASE
          WHEN user_agent ILIKE '%googlebot%' THEN 'Googlebot'
          WHEN user_agent ILIKE '%bingbot%' THEN 'Bingbot'
          WHEN user_agent ILIKE '%yandex%' THEN 'Yandex'
          WHEN user_agent ILIKE '%baidu%' THEN 'Baidu'
          WHEN user_agent ILIKE '%semrush%' THEN 'SEMrush'
          WHEN user_agent ILIKE '%ahrefs%' THEN 'Ahrefs'
          WHEN user_agent ILIKE '%mj12bot%' THEN 'Majestic'
          WHEN user_agent ILIKE '%dotbot%' THEN 'DotBot'
          WHEN user_agent ILIKE '%petalbot%' THEN 'PetalBot'
          WHEN user_agent ILIKE '%bytespider%' THEN 'ByteSpider'
          WHEN user_agent ILIKE '%gptbot%' THEN 'GPTBot'
          WHEN user_agent ILIKE '%claudebot%' THEN 'ClaudeBot'
          WHEN user_agent ILIKE '%chrome%' THEN 'Chrome (Real User)'
          WHEN user_agent ILIKE '%firefox%' THEN 'Firefox (Real User)'
          WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari (Real User)'
          WHEN user_agent ILIKE '%edge%' THEN 'Edge (Real User)'
          WHEN user_agent = '' OR user_agent IS NULL THEN 'No UA (Bot)'
          ELSE 'Other: ' || LEFT(user_agent, 50)
        END as agent_type,
        COUNT(*)::int as views
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY agent_type
      ORDER BY views DESC
      LIMIT 20
    `);

    // Countries / regions from IPs (approximate from visitor_id pattern)
    const { rows: searchEngineBreakdown } = await pool.query(`
      SELECT
        CASE
          WHEN referrer ILIKE '%google.%' THEN 'Google'
          WHEN referrer ILIKE '%bing.%' THEN 'Bing'
          WHEN referrer ILIKE '%yahoo.%' THEN 'Yahoo'
          WHEN referrer ILIKE '%duckduckgo.%' THEN 'DuckDuckGo'
          WHEN referrer ILIKE '%facebook.%' OR referrer ILIKE '%fb.%' THEN 'Facebook'
          WHEN referrer ILIKE '%twitter.%' OR referrer ILIKE '%t.co%' THEN 'Twitter/X'
          WHEN referrer = '' OR referrer IS NULL THEN 'Direct / Bot'
          ELSE 'Other'
        END as source,
        COUNT(*)::int as views
      FROM page_views
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY source
      ORDER BY views DESC
    `);

    return NextResponse.json({
      totals: totals[0] || { today: 0, week: 0, month: 0 },
      sitesToday,
      sitesWeek,
      topPages,
      topReferrers,
      hourlyTrend,
      searchPages,
      topUserAgents,
      searchEngineBreakdown,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
