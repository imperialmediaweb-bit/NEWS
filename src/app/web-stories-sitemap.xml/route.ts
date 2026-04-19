import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";

export const revalidate = 3600;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
    if (siteRows.length === 0) {
      return new NextResponse("", { status: 404 });
    }
    const siteId = siteRows[0].id;

    const { rows } = await pool.query(
      `SELECT slug, title, featured_image, published_at
       FROM articles
       WHERE site_id = $1 AND featured_image IS NOT NULL AND featured_image != ''
       ORDER BY published_at DESC
       LIMIT 1000`,
      [siteId]
    );

    const urls = rows
      .map((row) => {
        const slug = row.slug as string;
        const title = escapeXml(row.title as string);
        const image = escapeXml(row.featured_image as string);
        const lastmod = new Date(row.published_at as string).toISOString();
        return `  <url>
    <loc>https://${site.domain}/web-stories/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${image}</image:loc>
      <image:title>${title}</image:title>
    </image:image>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new NextResponse("", { status: 500 });
  }
}
