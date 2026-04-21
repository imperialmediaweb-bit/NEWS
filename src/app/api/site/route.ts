import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites, getActiveSite, getSiteByDomain } from "@/config/sites";

// Cache responses for 5 minutes on CDN, revalidate on demand
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "";
  const slug = searchParams.get("slug") || "";

  // Find site config
  let siteConfig = slug ? sites[slug] : getSiteByDomain(domain);
  if (!siteConfig) siteConfig = getActiveSite();

  // Try to get articles from DB
  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteConfig.slug]);
    if (siteRows.length === 0) {
      return NextResponse.json({ site: siteConfig, articles: null });
    }

    const siteId = siteRows[0].id;

    const cols = "id, title, slug, summary, featured_image, category, author, published_at, views";

    // Fetch articles by sections — only list columns, no content
    const [hero, trending, latest, localNews, usNews, worldNews, politics, sports, entertainment, business, technology, opinion] = await Promise.all([
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 4`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 ORDER BY views DESC LIMIT 6`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 15`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('local-news','local','news') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('us-news','national','us') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('world-news','world','international') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('politics','political') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('sports','sport') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('entertainment','celebrity','culture') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('business','economy','finance') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('technology','tech','science') ORDER BY published_at DESC LIMIT 8`, [siteId]),
      pool.query(`SELECT ${cols} FROM articles WHERE site_id = $1 AND category IN ('opinion','editorial','op-ed') ORDER BY published_at DESC LIMIT 8`, [siteId]),
    ]);

    const toArticle = (row: Record<string, unknown>) => ({
      img: (row.featured_image as string) || "https://picsum.photos/800/500?random=" + row.id,
      title: row.title as string,
      summary: (row.summary as string) || "",
      category: (row.category as string) || "News",
      date: new Date(row.published_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      author: (row.author as string) || "Staff Reporter",
      slug: row.slug as string,
    });

    const allArticles = latest.rows.map(toArticle);

    return NextResponse.json({
      site: siteConfig,
      articles: {
        heroMain: hero.rows[0] ? toArticle(hero.rows[0]) : null,
        heroSide: hero.rows.slice(1, 4).map(toArticle),
        trending: trending.rows.map(toArticle),
        popular: trending.rows.slice(0, 6).map(toArticle),
        localNews: localNews.rows.length > 0 ? localNews.rows.map(toArticle) : allArticles.slice(0, 8),
        usNews: usNews.rows.length > 0 ? usNews.rows.map(toArticle) : allArticles.slice(0, 8),
        worldNews: worldNews.rows.length > 0 ? worldNews.rows.map(toArticle) : allArticles.slice(0, 8),
        politics: politics.rows.length > 0 ? politics.rows.map(toArticle) : allArticles.slice(0, 8),
        sports: sports.rows.length > 0 ? sports.rows.map(toArticle) : allArticles.slice(0, 8),
        entertainment: entertainment.rows.length > 0 ? entertainment.rows.map(toArticle) : allArticles.slice(0, 8),
        business: business.rows.length > 0 ? business.rows.map(toArticle) : allArticles.slice(0, 8),
        technology: technology.rows.length > 0 ? technology.rows.map(toArticle) : allArticles.slice(0, 8),
        opinion: opinion.rows.length > 0 ? opinion.rows.map(toArticle) : allArticles.slice(0, 8),
        latestPosts: allArticles.slice(0, 9),
        sidebarLatest: allArticles.slice(0, 5),
        featuredStory: allArticles[0] || null,
        featuredStory2: allArticles[1] || null,
      },
      totalArticles: latest.rows.length,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // DB not connected — return config only
    return NextResponse.json({ site: siteConfig, articles: null });
  }
}
