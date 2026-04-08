import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");
  const search = searchParams.get("search") || "";
  const site = searchParams.get("site") || "";
  const category = searchParams.get("category") || "";
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`a.title ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }
    if (site) {
      conditions.push(`s.slug = $${idx++}`);
      params.push(site);
    }
    if (category) {
      conditions.push(`a.category = $${idx++}`);
      params.push(category);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [articlesRes, countRes] = await Promise.all([
      pool.query(
        `SELECT a.*, s.name as site_name FROM articles a
         JOIN sites s ON a.site_id = s.id
         ${where}
         ORDER BY a.published_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int as count FROM articles a
         JOIN sites s ON a.site_id = s.id
         ${where}`,
        params
      ),
    ]);

    return NextResponse.json({
      articles: articlesRes.rows,
      total: countRes.rows[0].count,
    });
  } catch (e) {
    console.error("Articles list error:", e);
    return NextResponse.json({ articles: [], total: 0, error: String(e) });
  }
}
