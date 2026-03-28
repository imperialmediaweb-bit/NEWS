import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site") || "";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (siteRows.length === 0) {
      return NextResponse.json({ stories: [] });
    }
    const siteId = siteRows[0].id;

    const { rows } = await pool.query(
      `SELECT id, title, summary, featured_image, category, slug, published_at, author
       FROM articles
       WHERE site_id = $1 AND featured_image IS NOT NULL AND featured_image != ''
       ORDER BY published_at DESC
       LIMIT $2`,
      [siteId, limit]
    );

    const stories = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title as string,
      summary: (row.summary as string) || "",
      featured_image: row.featured_image as string,
      category: (row.category as string) || "news",
      slug: row.slug as string,
      published_at: row.published_at as string,
      author: (row.author as string) || "Staff Reporter",
    }));

    return NextResponse.json({ stories });
  } catch {
    return NextResponse.json({ stories: [] });
  }
}
