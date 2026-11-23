import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { dirSchema } from "@/lib/directory";

/**
 * The directory pages worth indexing: the hub, statewide categories with 5+
 * listings, towns with 5+, town × category pages with 3+, and business pages
 * that are claimed, described or reviewed. Thin pages stay out (they are
 * noindex anyway).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host) || getActiveSite();
  const base = `https://${site.domain}`;
  const urls: string[] = [`${base}/directory`];
  try {
    await dirSchema();
    const [{ rows: cc }, { rows: cats }, { rows: cities }, { rows: biz }] = await Promise.all([
      pool.query(`SELECT city_slug, category FROM businesses WHERE site_slug = $1 AND status = 'active' GROUP BY city_slug, category HAVING COUNT(*) >= 3`, [site.slug]),
      pool.query(`SELECT category FROM businesses WHERE site_slug = $1 AND status = 'active' GROUP BY category HAVING COUNT(*) >= 5`, [site.slug]),
      pool.query(`SELECT city_slug FROM businesses WHERE site_slug = $1 AND status = 'active' GROUP BY city_slug HAVING COUNT(*) >= 5`, [site.slug]),
      pool.query(`SELECT slug FROM businesses WHERE site_slug = $1 AND status = 'active' AND (claimed OR rating_count > 0 OR description IS NOT NULL) LIMIT 20000`, [site.slug]),
    ]);
    for (const c of cats) urls.push(`${base}/directory/category/${c.category}`);
    for (const c of cities) urls.push(`${base}/directory/${c.city_slug}`);
    for (const c of cc) urls.push(`${base}/directory/${c.city_slug}/${c.category}`);
    for (const b of biz) urls.push(`${base}/directory/listing/${b.slug}`);
  } catch { /* the hub alone */ }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.slice(0, 50000).map((u) => `<url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join("\n")}\n</urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, s-maxage=3600" } });
}
