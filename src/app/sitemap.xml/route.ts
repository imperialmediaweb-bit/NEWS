import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
}

/**
 * Main sitemap — multi-tenant aware.
 * Reads the request host so every one of the 50 domains emits ITS OWN URLs.
 */
export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const baseUrl = `https://${site.domain}`;
  const now = new Date();

  const staticPages: SitemapEntry[] = [
    { url: baseUrl, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/local-news`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/us-news`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/world-news`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/politics`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/sports`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/entertainment`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/business`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/technology`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/opinion`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    // Hub pages — topic cluster authority pages
    { url: `${baseUrl}/hub/local-news`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/us-news`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/politics`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/crime`, lastModified: now, changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/sports`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/entertainment`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/celebrity`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/technology`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/business`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/lifestyle`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${baseUrl}/hub/world-news`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${baseUrl}/hub/opinion`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  let entries: SitemapEntry[] = staticPages;

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
    if (siteRows.length > 0) {
      const siteId = siteRows[0].id;
      // 10k most recent articles. Building 49k URLs meant a ~10MB string in
      // memory on every crawler hit (RAM spikes) plus a large response body.
      // Sites currently have only ~1k pages actually indexed, so deeper
      // coverage buys nothing while costing memory and egress.
      const { rows: articles } = await pool.query(
        "SELECT slug, category, published_at FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 10000",
        [siteId]
      );
      const articlePages: SitemapEntry[] = articles.map((row: Record<string, unknown>) => ({
        url: `${baseUrl}/${row.category}/${row.slug}`,
        lastModified: new Date(row.published_at as string),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
      entries = [...staticPages, ...articlePages];
    }
  } catch {
    entries = staticPages;
  }

  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${e.lastModified.toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=7200",
      "CDN-Cache-Control": "public, max-age=3600",
    },
  });
}
