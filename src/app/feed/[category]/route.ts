import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain, getActiveSite } from "@/config/sites";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const host = request.headers.get("host") || "";
  const site = getSiteByDomain(host) || getActiveSite();
  const siteUrl = `https://${site.domain}`;

  try {
    const { rows: siteRows } = await pool.query(
      "SELECT id FROM sites WHERE slug = $1",
      [site.slug]
    );
    if (siteRows.length === 0) {
      return new Response("<rss><channel><title>No site found</title></channel></rss>", {
        status: 404,
        headers: { "Content-Type": "application/rss+xml" },
      });
    }
    const siteId = (siteRows[0] as Record<string, unknown>).id;

    const variants = categoryVariants[category] || [category];
    const placeholders = variants.map((_, i) => `$${i + 2}`).join(", ");

    const { rows } = await pool.query(
      `SELECT id, title, slug, summary, category, author, featured_image, published_at
       FROM articles WHERE site_id = $1 AND category IN (${placeholders})
       ORDER BY published_at DESC LIMIT 50`,
      [siteId, ...variants]
    );

    const now = new Date().toUTCString();
    const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const items = (rows as Record<string, unknown>[])
      .map((row) => {
        const title = escapeXml((row.title as string) || "");
        const link = `${siteUrl}/article/${row.slug as string}`;
        const description = escapeXml((row.summary as string) || "");
        const pubDate = new Date(row.published_at as string).toUTCString();
        const author = escapeXml((row.author as string) || "Staff Reporter");
        const cat = escapeXml((row.category as string) || "News");
        const guid = link;
        const featuredImage = row.featured_image as string | null;

        let mediaEnclosure = "";
        if (featuredImage) {
          mediaEnclosure = `<enclosure url="${escapeXml(featuredImage)}" type="image/jpeg" />`;
        }

        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${cat}</category>
      <guid isPermaLink="true">${guid}</guid>
      ${mediaEnclosure}
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)} - ${escapeXml(categoryLabel)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(site.tagline)} - ${escapeXml(categoryLabel)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml",
        "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
        "CDN-Cache-Control": "public, max-age=1800",
      },
    });
  } catch {
    return new Response("<rss><channel><title>Error</title></channel></rss>", {
      status: 500,
      headers: { "Content-Type": "application/rss+xml" },
    });
  }
}
