import pool from "@/lib/db";
import { getSiteId } from "@/lib/site-id";
import { PLACEHOLDER_IMG } from "@/lib/homepage-data";

/**
 * Category listing data, shared by the server-rendered category page and the
 * /api/category route so both return exactly the same articles.
 */

export const CATEGORY_PER_PAGE = 20;

/**
 * URL slug → the category values actually stored in the database. Articles
 * were imported from several sources over time, so one section can be spelled
 * more than one way.
 */
const CATEGORY_VARIANTS: Record<string, string[]> = {
  "local-news": ["local-news", "local", "news", "general"],
  "us-news": ["us-news", "national", "us", "u-s"],
  "world-news": ["world-news", "world", "international"],
  politics: ["politics", "political"],
  sports: ["sports", "sport"],
  entertainment: ["entertainment", "celebrity", "culture"],
  business: ["business", "economy", "finance"],
  technology: ["technology", "tech", "science"],
  opinion: ["opinion", "editorial", "op-ed"],
  celebrity: ["celebrity", "entertainment", "culture"],
  crime: ["crime", "police", "courts"],
  health: ["health", "healthcare", "medical"],
  education: ["education", "schools"],
};

export function categoryVariants(slug: string): string[] {
  return CATEGORY_VARIANTS[slug] || [slug];
}

export interface ListArticle {
  img: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  slug: string;
}

export interface CategoryPage {
  articles: ListArticle[];
  page: number;
  totalPages: number;
  total: number;
}

export async function getCategoryArticles(
  siteSlug: string,
  categorySlug: string,
  page = 1
): Promise<CategoryPage> {
  const safePage = Math.max(1, page);
  const empty: CategoryPage = { articles: [], page: safePage, totalPages: 0, total: 0 };

  try {
    const siteId = await getSiteId(siteSlug);
    if (siteId === null) return empty;

    const variants = categoryVariants(categorySlug);
    const placeholders = variants.map((_, i) => `$${i + 2}`).join(", ");
    const offset = (safePage - 1) * CATEGORY_PER_PAGE;

    // One query for both the page of rows and the total, so pagination links
    // don't cost a second full count scan.
    const { rows } = await pool.query(
      `SELECT title, slug, summary, featured_image, category, author, published_at,
              count(*) OVER () AS total
         FROM articles
        WHERE site_id = $1 AND category IN (${placeholders})
        ORDER BY published_at DESC
        LIMIT ${CATEGORY_PER_PAGE} OFFSET ${offset}`,
      [siteId, ...variants]
    );

    if (rows.length === 0) return empty;

    const total = Number(rows[0].total) || rows.length;
    return {
      articles: rows.map(toListArticle),
      page: safePage,
      totalPages: Math.ceil(total / CATEGORY_PER_PAGE),
      total,
    };
  } catch (e) {
    console.error("[category] query failed:", e instanceof Error ? e.message : e);
    return empty;
  }
}

export async function getTagArticles(
  siteSlug: string,
  tag: string,
  page = 1
): Promise<CategoryPage> {
  const safePage = Math.max(1, page);
  const empty: CategoryPage = { articles: [], page: safePage, totalPages: 0, total: 0 };

  try {
    const siteId = await getSiteId(siteSlug);
    if (siteId === null) return empty;

    const term = `%${tag.replace(/-/g, " ")}%`;
    const offset = (safePage - 1) * CATEGORY_PER_PAGE;

    const { rows } = await pool.query(
      `SELECT title, slug, summary, featured_image, category, author, published_at,
              count(*) OVER () AS total
         FROM articles
        WHERE site_id = $1
          AND (title ILIKE $2 OR summary ILIKE $2 OR category ILIKE $2)
        ORDER BY published_at DESC
        LIMIT ${CATEGORY_PER_PAGE} OFFSET ${offset}`,
      [siteId, term]
    );

    if (rows.length === 0) return empty;

    const total = Number(rows[0].total) || rows.length;
    return {
      articles: rows.map(toListArticle),
      page: safePage,
      totalPages: Math.ceil(total / CATEGORY_PER_PAGE),
      total,
    };
  } catch (e) {
    console.error("[tag] query failed:", e instanceof Error ? e.message : e);
    return empty;
  }
}

function toListArticle(row: Record<string, unknown>): ListArticle {
  return {
    img: (row.featured_image as string) || PLACEHOLDER_IMG,
    title: row.title as string,
    summary: (row.summary as string) || "",
    category: (row.category as string) || "News",
    date: row.published_at
      ? new Date(row.published_at as string).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "",
    author: (row.author as string) || "Staff Reporter",
    slug: row.slug as string,
  };
}
