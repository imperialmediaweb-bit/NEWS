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

    const { rows } = await pool.query(
      `SELECT * FROM articles WHERE site_id = $1 AND category IN (${placeholders}) ORDER BY published_at DESC LIMIT 30`,
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

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
