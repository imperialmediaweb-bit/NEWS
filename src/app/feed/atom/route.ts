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
      return new Response("<feed xmlns=\"http://www.w3.org/2005/Atom\"><title>No site found</title></feed>", {
        status: 404,
        headers: { "Content-Type": "application/atom+xml" },
      });
    }
    const siteId = (siteRows[0] as Record<string, unknown>).id;

    const { rows } = await pool.query(
      `SELECT id, title, slug, summary, category, author, featured_image, published_at
       FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 50`,
      [siteId]
    );

    const now = new Date().toISOString();
    const entries = (rows as Record<string, unknown>[])
      .map((row) => {
        const title = escapeXml((row.title as string) || "");
        const link = `${siteUrl}/article/${row.slug as string}`;
        const summary = escapeXml((row.summary as string) || "");
        const updated = new Date(row.published_at as string).toISOString();
        const author = escapeXml((row.author as string) || "Staff Reporter");
        const category = escapeXml((row.category as string) || "News");
        const featuredImage = row.featured_image as string | null;

        let mediaLink = "";
        if (featuredImage) {
          mediaLink = `      <link rel="enclosure" href="${escapeXml(featuredImage)}" type="image/jpeg" />`;
        }

        return `  <entry>
    <title>${title}</title>
    <link href="${link}" rel="alternate" />
    <id>${link}</id>
    <updated>${updated}</updated>
    <summary>${summary}</summary>
    <author>
      <name>${author}</name>
    </author>
    <category term="${category}" />
${mediaLink}
  </entry>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.name)}</title>
  <link href="${siteUrl}" rel="alternate" />
  <link href="${siteUrl}/feed/atom" rel="self" />
  <id>${siteUrl}/feed/atom</id>
  <updated>${now}</updated>
  <subtitle>${escapeXml(site.tagline)}</subtitle>
${entries}
</feed>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/atom+xml",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch {
    return new Response("<feed xmlns=\"http://www.w3.org/2005/Atom\"><title>Error</title></feed>", {
      status: 500,
      headers: { "Content-Type": "application/atom+xml" },
    });
  }
}
