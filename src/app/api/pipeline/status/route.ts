import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function authCheck(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key");
  return token === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      configResult,
      queueResult,
      recentRuns,
      articlesToday,
      articlesWeek,
      errorCount,
    ] = await Promise.all([
      // Pipeline config
      pool.query("SELECT key, value FROM pipeline_config"),
      // Queue depth
      pool.query(
        `SELECT status, COUNT(*)::int as count FROM feed_items
         WHERE created_at > NOW() - INTERVAL '7 days'
         GROUP BY status`
      ),
      // Recent pipeline runs
      pool.query(
        `SELECT stage, category, items_processed, items_failed, duration_ms,
                error_message, started_at, completed_at
         FROM pipeline_runs ORDER BY started_at DESC LIMIT 20`
      ),
      // Articles generated today
      pool.query(
        `SELECT COUNT(*)::int as count FROM articles
         WHERE auto_generated = true AND published_at >= CURRENT_DATE`
      ),
      // Articles generated this week
      pool.query(
        `SELECT COUNT(*)::int as count FROM articles
         WHERE auto_generated = true AND published_at >= CURRENT_DATE - INTERVAL '7 days'`
      ),
      // Errors in last 24h
      pool.query(
        `SELECT COUNT(*)::int as count FROM feed_items
         WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'`
      ),
    ]);

    const config: Record<string, string> = {};
    for (const row of configResult.rows) {
      config[row.key] = row.value;
    }

    const queue: Record<string, number> = {};
    for (const row of queueResult.rows) {
      queue[row.status] = row.count;
    }

    return NextResponse.json({
      config,
      queue,
      recentRuns: recentRuns.rows,
      stats: {
        articlesToday: articlesToday.rows[0].count,
        articlesThisWeek: articlesWeek.rows[0].count,
        errorsLast24h: errorCount.rows[0].count,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
