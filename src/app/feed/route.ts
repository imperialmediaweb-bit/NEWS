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
      return new Response("<rss><channel><title>No site found</title></channel></rss>", {
        status: 404,
        headers: { "Content-Type": "application/rss+xml" },
      });
    }
    const siteId = (siteRows[0] as Record<string, unknown>).id;

    const { rows } = await pool.query(
      `SELECT id, title, slug, summary, category, author, featured_image, published_at
       FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 50`,
      [siteId]
    );

    const now = new Date().toUTCString();
    const items = (rows as Record<string, unknown>[])
      .map((row) => {
        const title = escapeXml((row.title as string) || "");
        const link = `${siteUrl}/article/${row.slug as string}`;
        const description = escapeXml((row.summary as string) || "");
        const pubDate = new Date(row.published_at as string).toUTCString();
        const author = escapeXml((row.author as string) || "Staff Reporter");
        const category = escapeXml((row.category as string) || "News");
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
      <category>${category}</category>
      <guid isPermaLink="true">${guid}</guid>
      ${mediaEnclosure}
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(site.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch {
    return new Response("<rss><channel><title>Error</title></channel></rss>", {
      status: 500,
      headers: { "Content-Type": "application/rss+xml" },
    });
  }
}
