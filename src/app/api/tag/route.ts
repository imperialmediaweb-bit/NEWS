import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site") || "";
  const tag = searchParams.get("tag") || "";

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (siteRows.length === 0) {
      return NextResponse.json({ articles: [] });
    }
    const siteId = siteRows[0].id;

    // Search articles where title, summary, or category contains the tag keyword
    const keyword = tag.replace(/-/g, " ");
    const { rows } = await pool.query(
      `SELECT * FROM articles WHERE site_id = $1
       AND (title ILIKE $2 OR summary ILIKE $2 OR category ILIKE $2)
       ORDER BY published_at DESC LIMIT 20`,
      [siteId, `%${keyword}%`]
    );

    const articles = rows.map((row: Record<string, unknown>) => ({
      img: (row.featured_image as string) || `https://picsum.photos/800/500?random=${row.id}`,
      title: row.title as string,
      summary: (row.summary as string) || "",
      category: (row.category as string) || "News",
      date: new Date(row.published_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      author: (row.author as string) || "Staff Reporter",
      slug: row.slug as string,
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
