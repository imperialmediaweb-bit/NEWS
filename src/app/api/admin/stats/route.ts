import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [sitesRes, articlesRes, todayRes, viewsRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int as count FROM sites"),
      pool.query("SELECT COUNT(*)::int as count FROM articles"),
      pool.query(
        "SELECT COUNT(*)::int as count FROM articles WHERE published_at >= CURRENT_DATE"
      ),
      pool.query(
        "SELECT COALESCE(SUM(views), 0)::bigint as total FROM articles"
      ),
    ]);

    return NextResponse.json({
      totalSites: sitesRes.rows[0].count,
      totalArticles: articlesRes.rows[0].count,
      todayArticles: todayRes.rows[0].count,
      totalViews: Number(viewsRes.rows[0].total),
    });
  } catch {
    // DB not connected yet — return defaults
    return NextResponse.json({
      totalSites: 50,
      totalArticles: 0,
      todayArticles: 0,
      totalViews: 0,
    });
  }
}
