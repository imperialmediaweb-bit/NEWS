import { MetadataRoute } from "next";
import pool from "@/lib/db";
import { getActiveSite } from "@/config/sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getActiveSite();
  const baseUrl = `https://${site.domain}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/local-news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/us-news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/world-news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/politics`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/sports`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/entertainment`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/business`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/technology`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/opinion`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    // Hub pages — topic cluster authority pages
    { url: `${baseUrl}/hub/local-news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/us-news`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/politics`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/crime`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${baseUrl}/hub/sports`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/entertainment`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/celebrity`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/technology`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/business`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/hub/lifestyle`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${baseUrl}/hub/world-news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    { url: `${baseUrl}/hub/opinion`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
    if (siteRows.length === 0) return staticPages;

    const siteId = siteRows[0].id;
    const { rows: articles } = await pool.query(
      "SELECT slug, category, published_at FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 5000",
      [siteId]
    );

    const articlePages: MetadataRoute.Sitemap = articles.map((row) => ({
      url: `${baseUrl}/${row.category}/${row.slug}`,
      lastModified: new Date(row.published_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...articlePages];
  } catch {
    return staticPages;
  }
}
