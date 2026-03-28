import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";

export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
    if (siteRows.length === 0) {
      return new NextResponse("<urlset/>", { headers: { "Content-Type": "application/xml" } });
    }

    const siteId = siteRows[0].id;

    // Google News sitemap only includes articles from last 48 hours
    const { rows: articles } = await pool.query(
      `SELECT title, slug, category, published_at, author
       FROM articles WHERE site_id = $1 AND published_at > NOW() - INTERVAL '48 hours'
       ORDER BY published_at DESC LIMIT 1000`,
      [siteId]
    );

    const urls = articles.map((row: Record<string, unknown>) => {
      const pubDate = new Date(row.published_at as string).toISOString();
      const title = (row.title as string).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `  <url>
    <loc>https://${site.domain}/${row.category}/${row.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${site.name}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch {
    return new NextResponse("<urlset/>", { headers: { "Content-Type": "application/xml" } });
  }
}
