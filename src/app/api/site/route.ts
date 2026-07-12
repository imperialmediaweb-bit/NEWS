import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites, getActiveSite, getSiteByDomain } from "@/config/sites";
import type { SiteConfig } from "@/config/site-config";

// Cache responses for 5 minutes on CDN, revalidate on demand
export const revalidate = 300;

interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  featured_image: string | null;
  category: string | null;
  author: string | null;
  published_at: string;
  views: number | null;
}

const toArticle = (row: ArticleRow) => ({
  img: row.featured_image || "https://picsum.photos/800/500?random=" + row.id,
  title: row.title,
  summary: row.summary || "",
  category: row.category || "News",
  date: new Date(row.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  author: row.author || "Staff Reporter",
  slug: row.slug,
});

// Category buckets — map many DB category values to each homepage section
const BUCKETS: Record<string, string[]> = {
  localNews: ["local-news", "local", "news"],
  usNews: ["us-news", "national", "us"],
  worldNews: ["world-news", "world", "international"],
  politics: ["politics", "political"],
  sports: ["sports", "sport"],
  entertainment: ["entertainment", "celebrity", "culture"],
  business: ["business", "economy", "finance"],
  technology: ["technology", "tech", "science"],
  opinion: ["opinion", "editorial", "op-ed"],
};

// Ensure the site row exists (self-heal if the sites table was never seeded)
async function ensureSiteId(config: SiteConfig): Promise<number | null> {
  const { rows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [config.slug]);
  if (rows.length > 0) return rows[0].id;
  try {
    const { rows: created } = await pool.query(
      `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET domain = EXCLUDED.domain
       RETURNING id`,
      [config.slug, config.domain, config.name, config.logoFirst, config.logoSecond,
       config.city, config.state, config.stateAbbr, config.tagline]
    );
    return created[0]?.id ?? null;
  } catch (e) {
    console.error("ensureSiteId failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "";
  const slug = searchParams.get("slug") || "";

  let siteConfig = slug ? sites[slug] : getSiteByDomain(domain);
  if (!siteConfig) siteConfig = getActiveSite();

  try {
    const siteId = await ensureSiteId(siteConfig);
    if (siteId === null) {
      return NextResponse.json({ site: siteConfig, articles: null });
    }

    // ONE query for the recent article pool (was 12 parallel queries that
    // exhausted the 10-connection pool under crawler load). Bucket by
    // category in JS below.
    const { rows } = await pool.query<ArticleRow>(
      `SELECT id, title, slug, summary, featured_image, category, author, published_at, views
       FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 200`,
      [siteId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ site: siteConfig, articles: null });
    }

    const all = rows.map(toArticle);
    const inBucket = (keys: string[]) =>
      rows.filter((r) => keys.includes((r.category || "").toLowerCase())).map(toArticle);

    const section = (name: keyof typeof BUCKETS) => {
      const got = inBucket(BUCKETS[name]).slice(0, 8);
      return got.length > 0 ? got : all.slice(0, 8);
    };

    const trending = [...rows]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 6)
      .map(toArticle);

    return NextResponse.json({
      site: siteConfig,
      articles: {
        heroMain: all[0] || null,
        heroSide: all.slice(1, 4),
        trending,
        popular: trending.slice(0, 6),
        localNews: section("localNews"),
        usNews: section("usNews"),
        worldNews: section("worldNews"),
        politics: section("politics"),
        sports: section("sports"),
        entertainment: section("entertainment"),
        business: section("business"),
        technology: section("technology"),
        opinion: section("opinion"),
        latestPosts: all.slice(0, 9),
        sidebarLatest: all.slice(0, 5),
        featuredStory: all[0] || null,
        featuredStory2: all[1] || null,
      },
      totalArticles: rows.length,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("/api/site failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ site: siteConfig, articles: null });
  }
}
