import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const revalidate = 600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site") || "";
  const articleSlug = searchParams.get("slug") || "";

  try {
    // Get site
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (siteRows.length === 0) {
      return NextResponse.json({ article: null, related: [] });
    }
    const siteId = siteRows[0].id;

    // Get article by slug
    const { rows: articleRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND slug = $2 LIMIT 1",
      [siteId, articleSlug]
    );

    if (articleRows.length === 0) {
      return NextResponse.json({ article: null, related: [] });
    }

    const article = articleRows[0];

    // Get related articles (same category)
    const { rows: relatedRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND category = $2 AND id != $3 ORDER BY published_at DESC LIMIT 3",
      [siteId, article.category, article.id]
    );

    const format = (row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title as string,
      slug: row.slug as string,
      content: row.content as string,
      summary: (row.summary as string) || "",
      category: (row.category as string) || "news",
      author: (row.author as string) || "Staff Reporter",
      featured_image: (row.featured_image as string) || "",
      published_at: row.published_at as string,
      views: row.views as number,
    });

    return NextResponse.json({
      article: format(article),
      related: relatedRows.map(format),
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch {
    return NextResponse.json({ article: null, related: [] });
  }
}
