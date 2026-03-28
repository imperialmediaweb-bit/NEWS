import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Simple query that works even if schema is slightly different
    const { rows } = await pool.query(
      `SELECT s.slug, s.name,
       (SELECT COUNT(*)::int FROM articles a WHERE a.site_id = s.id) as article_count
       FROM sites s
       ORDER BY s.name`
    );

    const statusMap: Record<string, { name: string; count: number }> = {};
    for (const row of rows) {
      statusMap[row.slug as string] = {
        name: row.name as string,
        count: (row.article_count as number) || 0,
      };
    }

    return NextResponse.json(statusMap);
  } catch (e) {
    // Return error so we can debug
    return NextResponse.json({ _error: String(e) });
  }
}
