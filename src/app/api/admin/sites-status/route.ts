import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT s.slug, s.name, COUNT(a.id)::int as article_count
       FROM sites s
       LEFT JOIN articles a ON a.site_id = s.id
       GROUP BY s.id, s.slug, s.name
       ORDER BY s.name`
    );

    const statusMap: Record<string, { name: string; count: number }> = {};
    for (const row of rows) {
      statusMap[row.slug as string] = {
        name: row.name as string,
        count: row.article_count as number,
      };
    }

    return NextResponse.json(statusMap);
  } catch {
    return NextResponse.json({});
  }
}
