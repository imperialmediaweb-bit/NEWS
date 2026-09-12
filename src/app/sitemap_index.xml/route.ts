import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { getSiteId } from "@/lib/site-id";
import { SITEMAP_PAGE_SIZE } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const now = new Date().toISOString();
  const base = `https://${site.domain}`;

  const entries = [
    `${base}/sitemap.xml`,
    `${base}/news-sitemap.xml`,
    `${base}/seo-sitemap.xml`,
    `${base}/web-stories-sitemap.xml`,
  ];

  // List one article sitemap per 5,000 articles. /sitemap.xml only carries the
  // newest 10,000, so without these the older half of an archive appears in no
  // sitemap at all — and on this network that is most of it.
  try {
    const siteId = await getSiteId(site.slug);
    if (siteId !== null) {
      const { rows } = await pool.query(
        "SELECT count(*)::int AS total FROM articles WHERE site_id = $1",
        [siteId]
      );
      const total = Number(rows[0]?.total) || 0;
      const pages = Math.ceil(total / SITEMAP_PAGE_SIZE);
      for (let i = 1; i <= pages; i++) {
        entries.push(`${base}/sitemap-articles/${i}.xml`);
      }
    }
  } catch {
    // The four fixed sitemaps above are still worth serving on their own.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      Vary: "Host",
    },
  });
}
