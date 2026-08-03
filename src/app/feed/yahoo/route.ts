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

/**
 * Yahoo News optimized RSS feed.
 * Yahoo requires:
 * - media:content for images
 * - Full article content in content:encoded
 * - Proper GUID
 * - media:credit, media:description
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const site = getSiteByDomain(host) || getActiveSite();
  const siteUrl = `https://${site.domain}`;

  try {
    const { rows: siteRows } = await pool.query(
      "SELECT id FROM sites WHERE slug = $1",
      [site.slug]
    );
    if (siteRows.length === 0) {
      return new Response("<rss><channel><title>No site</title></channel></rss>", {
        status: 404,
        headers: { "Content-Type": "application/rss+xml" },
      });
    }
    const siteId = (siteRows[0] as Record<string, unknown>).id;

    const { rows } = await pool.query(
      `SELECT id, title, slug, content, summary, category, author, featured_image, published_at
       FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 50`,
      [siteId]
    );

    const now = new Date().toUTCString();
    const items = (rows as Record<string, unknown>[])
      .map((row) => {
        const title = escapeXml((row.title as string) || "");
        const link = `${siteUrl}/${row.category as string}/${row.slug as string}`;
        const description = escapeXml((row.summary as string) || "");
        const content = (row.content as string) || "";
        const pubDate = new Date(row.published_at as string).toUTCString();
        const author = escapeXml((row.author as string) || "Staff Reporter");
        const category = escapeXml((row.category as string) || "News");
        const featuredImage = row.featured_image as string | null;

        let mediaContent = "";
        if (featuredImage) {
          mediaContent = `
      <media:content url="${escapeXml(featuredImage)}" type="image/jpeg" medium="image" width="1200" height="630">
        <media:description type="plain">${title}</media:description>
        <media:credit role="photographer">${escapeXml(site.name)}</media:credit>
      </media:content>
      <media:thumbnail url="${escapeXml(featuredImage)}" width="1200" height="630" />`;
        }

        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      <category>${category}</category>
      <guid isPermaLink="true">${link}</guid>${mediaContent}
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(site.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed/yahoo" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/api/favicon?site=${site.slug}</url>
      <title>${escapeXml(site.name)}</title>
      <link>${siteUrl}</link>
    </image>
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
