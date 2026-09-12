import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { getSiteId } from "@/lib/site-id";
import { SITEMAP_PAGE_SIZE } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

/**
 * Paginated article sitemaps: /sitemap-articles/1.xml, /2.xml, ...
 *
 * /sitemap.xml carries the newest 10,000 articles and stops. Alabama alone has
 * more than that — its 10,000th newest article dates from October 2024, so
 * everything older sat in no sitemap at all. Raising that limit is not the
 * answer either: 49,000 URLs meant building a ~10MB string in memory on every
 * crawler request.
 *
 * Pages of 5,000 keep each response near a megabyte while covering the whole
 * archive, however large it grows.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  const host = request.headers.get("host") || "";
  const domain = host.split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(domain) || getActiveSite();

  // The path segment arrives as "3.xml".
  const page = parseInt(params.page.replace(/\.xml$/i, ""), 10);
  if (!Number.isFinite(page) || page < 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const siteId = await getSiteId(site.slug);
  if (siteId === null) return new NextResponse("Not found", { status: 404 });

  const { rows } = await pool.query(
    `SELECT slug, category, published_at
       FROM articles
      WHERE site_id = $1
      ORDER BY published_at DESC
      LIMIT $2 OFFSET $3`,
    [siteId, SITEMAP_PAGE_SIZE, (page - 1) * SITEMAP_PAGE_SIZE]
  );

  // A page past the end is not an empty sitemap, it does not exist.
  if (rows.length === 0) return new NextResponse("Not found", { status: 404 });

  const urls = rows
    .map((row: { slug: string; category: string | null; published_at: string }) => {
      const loc = `https://${site.domain}/${row.category || "local-news"}/${row.slug}`;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date(row.published_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      // Older pages never change, but they all go through this one route, so
      // an hour at the edge is the compromise.
      "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Host",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
