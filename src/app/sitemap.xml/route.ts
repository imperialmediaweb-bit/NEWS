import { STATE_CITIES, TEAMS } from "@/lib/pipeline/google-news";
import { PLACES } from "@/lib/pipeline/relevance";
import { STATE_FACTS } from "@/config/state-data";
import { countiesOf, citiesOf as citiesWx } from "@/lib/local-data";
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
    { url: `${baseUrl}/gas-prices`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/things-to-do`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/alerts`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
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

  // city, county and team pages: what people search for locally
  const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cityNames = Array.from(new Set((STATE_CITIES[site.state] || []).concat(PLACES[site.state] || [])));
  const teamNames = (TEAMS[site.state] || STATE_FACTS[site.state]?.teams || []).filter((t) => t.length >= 4);
  const unit = site.state === "Louisiana" ? "parish" : "county";
  const topicPages: SitemapEntry[] = [
    ...citiesWx(site.state).map(([c]) => ({ url: `${baseUrl}/weather/${slug(c)}`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.75 })),
    ...cityNames.map((c) => ({ url: `${baseUrl}/city/${slug(c)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(STATE_FACTS[site.state]?.counties || countiesOf(site.state).slice(0, 10)).map((c) => ({ url: `${baseUrl}/county/${slug(`${c} ${unit}`)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...teamNames.map((t) => ({ url: `${baseUrl}/team/${slug(t)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.75 })),
  ];

  // pages only some states have
  const special: Record<string, string[]> = { AK: ["/aurora-forecast", "/snow-report"], NV: ["/las-vegas-shows", "/snow-report"], LA: ["/mardi-gras"] };
  for (const ab of ["AZ", "CA", "CO", "ID", "MT", "NM", "OR", "UT", "WA", "WY", "SD"]) (special[ab] ||= []).push("/snow-report");
  for (const ab of ["ND", "MN", "ME", "MT", "WA", "ID", "WI", "MI", "VT", "NH", "SD", "NY", "OR", "WY", "IA", "MA"]) (special[ab] ||= []).push("/aurora-forecast");
  for (const ab of ["FL", "LA", "TX", "NC", "SC", "GA", "AL", "MS", "HI"]) (special[ab] ||= []).push("/hurricane-tracker");
  for (const ab of ["CA", "AK", "NV", "WA", "OR", "UT", "HI", "ID", "MT", "WY", "OK", "TX", "NM", "AZ"]) (special[ab] ||= []).push("/earthquakes");
  for (const ab of ["CA", "OR", "WA", "AZ", "CO", "ID", "MT", "NM", "NV", "UT", "WY", "TX", "OK", "AK"]) (special[ab] ||= []).push("/wildfires");
  for (const ab of ["HI"]) (special[ab] ||= []).push("/surf-report");
  for (const ab of ["NY"]) (special[ab] ||= []).push("/subway-status");
  for (const ab of ["OK", "KS", "NE", "TX", "IA", "MO", "AR", "AL", "MS", "TN", "KY", "IL", "IN", "MN", "SD", "ND", "LA", "GA"]) (special[ab] ||= []).push("/tornado-reports");
  for (const ab of ["TX", "GA", "FL", "OH", "PA", "AL", "LA", "CA", "MS", "OK"]) (special[ab] ||= []).push("/high-school-football");
  for (const ab of ["KY"]) (special[ab] ||= []).push("/kentucky-derby");
  for (const ab of ["TN"]) (special[ab] ||= []).push("/nashville-concerts");
  for (const ab of ["VT", "ME", "NH", "NY", "MA", "CT"]) (special[ab] ||= []).push("/fall-foliage");
  for (const ab of ["MN", "WI", "MI", "ND", "ME", "VT", "NH", "NY"]) (special[ab] ||= []).push("/ice-fishing");
  for (const ab of ["IA", "NE", "KS", "IL", "IN", "MN", "ND", "SD", "MO", "OH"]) (special[ab] ||= []).push("/crop-report");
  for (const ab of ["MT", "WY", "UT", "AZ", "CO", "CA", "WA"]) (special[ab] ||= []).push("/national-park-roads");
  for (const ab of ["AZ", "NV", "TX", "CA", "NM", "FL"]) (special[ab] ||= []).push("/heat-index");
  const specialPages: SitemapEntry[] = (special[site.stateAbbr] || []).map((p) => ({ url: `${baseUrl}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 }));

  let entries: SitemapEntry[] = staticPages.concat(topicPages, specialPages);

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
      "Cache-Control": "public, max-age=900, s-maxage=86400, stale-while-revalidate=604800",
      "CDN-Cache-Control": "public, max-age=3600",
    },
  });
}
