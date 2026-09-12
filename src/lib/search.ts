import pool from "@/lib/db";
import { getSiteId } from "@/lib/site-id";
import { PLACEHOLDER_IMG } from "@/lib/homepage-data";
import type { SiteConfig } from "@/config/site-config";

export interface SearchHit {
  title: string;
  slug: string;
  summary: string;
  category: string;
  author: string;
  date: string;
  img: string;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
}

export const SEARCH_PAGE_SIZE = 20;

/**
 * Full-text search over one site's articles.
 *
 * Uses Postgres `websearch_to_tsquery`, which understands the syntax readers
 * already type ("quoted phrases", -excluded, OR) and, unlike ILIKE '%term%',
 * can use the GIN index created by /api/admin/optimize-db. On ~745k rows that
 * is the difference between an index lookup and a full sequential scan.
 */
export async function searchArticles(
  site: SiteConfig,
  rawQuery: string,
  page = 1
): Promise<SearchResult> {
  const q = rawQuery.trim().slice(0, 120);
  const pageSize = SEARCH_PAGE_SIZE;
  const empty: SearchResult = { hits: [], total: 0, page, pageSize };

  if (q.length < 2) return empty;

  const siteId = await getSiteId(site.slug);
  if (!siteId) return empty;

  const offset = (Math.max(1, page) - 1) * pageSize;

  try {
    const { rows } = await pool.query(
      `WITH matches AS (
         SELECT id, title, slug, summary, category, author, published_at, featured_image,
                ts_rank(
                  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')),
                  websearch_to_tsquery('english', $2)
                ) AS rank
           FROM articles
          WHERE site_id = $1
            AND to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
                @@ websearch_to_tsquery('english', $2)
       )
       SELECT *, count(*) OVER () AS total
         FROM matches
        ORDER BY rank DESC, published_at DESC
        LIMIT $3 OFFSET $4`,
      [siteId, q, pageSize, offset]
    );

    if (rows.length === 0) return empty;

    return {
      hits: rows.map(toHit),
      total: Number(rows[0].total) || rows.length,
      page,
      pageSize,
    };
  } catch (e) {
    console.error("[search] query failed:", e instanceof Error ? e.message : e);
    return empty;
  }
}

interface Row {
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  author: string | null;
  published_at: string | Date;
  featured_image: string | null;
}

function toHit(row: Row): SearchHit {
  return {
    title: row.title,
    slug: row.slug,
    summary: row.summary || "",
    category: row.category || "local-news",
    author: row.author || "Newsroom",
    date: new Date(row.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    img: row.featured_image || PLACEHOLDER_IMG,
  };
}
