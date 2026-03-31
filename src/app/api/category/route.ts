import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site") || "";
  const category = searchParams.get("category") || "";

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (siteRows.length === 0) {
      return NextResponse.json({ articles: [] });
    }
    const siteId = siteRows[0].id;

    // Map URL category slugs to possible DB category values
    const categoryVariants: Record<string, string[]> = {
      "local-news": ["local-news", "local", "news", "general"],
      "us-news": ["us-news", "national", "us", "u-s"],
      "world-news": ["world-news", "world", "international"],
      politics: ["politics", "political"],
      sports: ["sports", "sport"],
      entertainment: ["entertainment", "celebrity", "culture"],
      business: ["business", "economy", "finance"],
      technology: ["technology", "tech", "science"],
      opinion: ["opinion", "editorial", "op-ed"],
      celebrity: ["celebrity", "entertainment", "culture"],
      crime: ["crime", "police", "courts"],
      health: ["health", "healthcare", "medical"],
      education: ["education", "schools"],
    };

    const variants = categoryVariants[category] || [category];
    const placeholders = variants.map((_, i) => `$${i + 2}`).join(", ");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = 20;
    const offset = (page - 1) * perPage;

    // Get total count
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as total FROM articles WHERE site_id = $1 AND category IN (${placeholders})`,
      [siteId, ...variants]
    );
    const total = parseInt(countRows[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / perPage);

    const { rows } = await pool.query(
      `SELECT * FROM articles WHERE site_id = $1 AND category IN (${placeholders}) ORDER BY published_at DESC LIMIT ${perPage} OFFSET ${offset}`,
      [siteId, ...variants]
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

    return NextResponse.json({ articles, page, totalPages, total });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
