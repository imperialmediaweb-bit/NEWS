import pool from "@/lib/db";
import type { SiteConfig } from "@/config/site-config";

/**
 * Shared homepage data builder — used by BOTH the server-rendered homepage
 * (src/app/page.tsx) and the /api/site route, so Googlebot and users see the
 * exact same real articles in the initial HTML.
 */

// Neutral branded placeholder (inline SVG) — used when an article has no
// featured image. Never use third-party random-photo services in production.
export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%23111111'/%3E%3Ctext x='400' y='260' font-family='Georgia,serif' font-size='42' fill='%23c1121f' text-anchor='middle' font-weight='bold'%3ENEWS%3C/text%3E%3C/svg%3E";

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

export interface HomeArticle {
  img: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  slug: string;
}

export interface HomeArticles {
  heroMain: HomeArticle | null;
  heroSide: HomeArticle[];
  trending: HomeArticle[];
  popular: HomeArticle[];
  localNews: HomeArticle[];
  usNews: HomeArticle[];
  worldNews: HomeArticle[];
  politics: HomeArticle[];
  sports: HomeArticle[];
  entertainment: HomeArticle[];
  business: HomeArticle[];
  technology: HomeArticle[];
  opinion: HomeArticle[];
  latestPosts: HomeArticle[];
  sidebarLatest: HomeArticle[];
  featuredStory: HomeArticle | null;
  featuredStory2: HomeArticle | null;
}

const toArticle = (row: ArticleRow): HomeArticle => ({
  img: row.featured_image || PLACEHOLDER_IMG,
  title: row.title,
  summary: row.summary || "",
  category: row.category || "News",
  date: new Date(row.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  author: row.author || "Staff Reporter",
  slug: row.slug,
});

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
export async function ensureSiteId(config: SiteConfig): Promise<number | null> {
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

export async function getHomepageArticles(config: SiteConfig): Promise<HomeArticles | null> {
  try {
    const siteId = await ensureSiteId(config);
    if (siteId === null) return null;

    const { rows } = await pool.query<ArticleRow>(
      `SELECT id, title, slug, summary, featured_image, category, author, published_at, views
       FROM articles WHERE site_id = $1 ORDER BY published_at DESC LIMIT 120`,
      [siteId]
    );
    if (rows.length === 0) return null;

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

    return {
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
    };
  } catch (e) {
    console.error("getHomepageArticles failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
