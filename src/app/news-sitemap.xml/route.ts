import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Google News Sitemap — optimized for Google News inclusion.
 * Includes: keywords, image tags, genres.
 */
export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();

  try {
    const { rows: siteRows } = await pool.query(
      "SELECT id FROM sites WHERE slug = $1",
      [site.slug]
    );
    if (siteRows.length === 0) {
      return new NextResponse("<urlset/>", {
        headers: { "Content-Type": "application/xml" },
      });
    }

    const siteId = siteRows[0].id;

    // Google News sitemap: articles from last 48 hours
    const { rows: articles } = await pool.query(
      `SELECT title, slug, category, published_at, author, featured_image, summary
       FROM articles WHERE site_id = $1 AND published_at > NOW() - INTERVAL '48 hours'
       ORDER BY published_at DESC LIMIT 1000`,
      [siteId]
    );

    const categoryToGenre: Record<string, string> = {
      opinion: "Opinion",
      lifestyle: "Feature",
      entertainment: "Feature",
      celebrity: "Feature",
    };

    const urls = articles
      .map((row: Record<string, unknown>) => {
        const pubDate = new Date(row.published_at as string).toISOString();
        const title = escapeXml((row.title as string) || "");
        const category = (row.category as string) || "news";
        const image = row.featured_image as string | null;

        // Generate keywords from title and category
        const keywords = [
          site.state,
          site.city,
          category.replace(/-/g, " "),
          ...title
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .slice(0, 5),
        ]
          .map((k: string) => k.toLowerCase())
          .join(", ");

        const genre = categoryToGenre[category] || "Blog";

        let imageTag = "";
        if (image) {
          imageTag = `
    <image:image>
      <image:loc>${escapeXml(image)}</image:loc>
      <image:caption>${title}</image:caption>
    </image:image>`;
        }

        return `  <url>
    <loc>https://${site.domain}/${category}/${row.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(site.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:genres>${genre}</news:genres>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      <news:keywords>${escapeXml(keywords)}</news:keywords>
    </news:news>${imageTag}
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
        "CDN-Cache-Control": "public, max-age=1800",
      },
    });
  } catch {
    return new NextResponse("<urlset/>", {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
