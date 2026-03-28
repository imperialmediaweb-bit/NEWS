import pool from "./db";
import { DbSite, DbArticle } from "./db-types";

// ─── Site queries ───

export async function getSiteByDomain(domain: string): Promise<DbSite | null> {
  const { rows } = await pool.query<DbSite>(
    "SELECT * FROM sites WHERE domain = $1",
    [domain]
  );
  return rows[0] || null;
}

export async function getSiteBySlug(slug: string): Promise<DbSite | null> {
  const { rows } = await pool.query<DbSite>(
    "SELECT * FROM sites WHERE slug = $1",
    [slug]
  );
  return rows[0] || null;
}

export async function getAllSites(): Promise<DbSite[]> {
  const { rows } = await pool.query<DbSite>(
    "SELECT * FROM sites ORDER BY name"
  );
  return rows;
}

// ─── Article queries ───

export async function getArticlesBySite(
  siteId: number,
  options: {
    category?: string;
    limit?: number;
    offset?: number;
    trending?: boolean;
    featured?: boolean;
    hero?: boolean;
  } = {}
): Promise<DbArticle[]> {
  const conditions = ["site_id = $1"];
  const params: (string | number | boolean)[] = [siteId];
  let idx = 2;

  if (options.category) {
    conditions.push(`category = $${idx++}`);
    params.push(options.category);
  }
  if (options.trending) {
    conditions.push("is_trending = true");
  }
  if (options.featured) {
    conditions.push("is_featured = true");
  }
  if (options.hero) {
    conditions.push("is_hero = true");
  }

  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const { rows } = await pool.query<DbArticle>(
    `SELECT * FROM articles
     WHERE ${conditions.join(" AND ")}
     ORDER BY published_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return rows;
}

export async function getArticleBySlug(
  siteId: number,
  slug: string
): Promise<DbArticle | null> {
  const { rows } = await pool.query<DbArticle>(
    "SELECT * FROM articles WHERE site_id = $1 AND slug = $2",
    [siteId, slug]
  );
  return rows[0] || null;
}

export async function getArticleCount(
  siteId?: number,
  category?: string
): Promise<number> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let idx = 1;

  if (siteId) {
    conditions.push(`site_id = $${idx++}`);
    params.push(siteId);
  }
  if (category) {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int as count FROM articles ${where}`,
    params
  );
  return rows[0].count;
}

export async function getCategoriesBySite(
  siteId: number
): Promise<{ name: string; slug: string; count: number }[]> {
  const { rows } = await pool.query(
    `SELECT category as name, category as slug, COUNT(*)::int as count
     FROM articles WHERE site_id = $1
     GROUP BY category ORDER BY count DESC`,
    [siteId]
  );
  return rows;
}

// ─── Admin mutations ───

export async function createArticle(
  article: Omit<DbArticle, "id" | "created_at" | "views">
): Promise<DbArticle> {
  const { rows } = await pool.query<DbArticle>(
    `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, is_featured, is_trending, is_hero, wp_original_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      article.site_id,
      article.title,
      article.slug,
      article.content,
      article.summary,
      article.category,
      article.author,
      article.featured_image,
      article.published_at,
      article.is_featured,
      article.is_trending,
      article.is_hero,
      (article as unknown as Record<string, unknown>).wp_original_id || null,
    ]
  );
  return rows[0];
}

export async function updateArticle(
  id: number,
  updates: Partial<DbArticle>
): Promise<DbArticle | null> {
  const fields = Object.keys(updates).filter(
    (k) => k !== "id" && k !== "created_at"
  );
  if (fields.length === 0) return null;

  const sets = fields.map((f, i) => `${f} = $${i + 2}`);
  const values = fields.map((f) => (updates as Record<string, unknown>)[f]);

  const { rows } = await pool.query<DbArticle>(
    `UPDATE articles SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] || null;
}

export async function deleteArticle(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM articles WHERE id = $1", [
    id,
  ]);
  return (rowCount ?? 0) > 0;
}

// ─── Stats ───

export async function getDashboardStats(): Promise<{
  totalSites: number;
  totalArticles: number;
  todayArticles: number;
  totalViews: number;
}> {
  const [sites, articles, today, views] = await Promise.all([
    pool.query("SELECT COUNT(*)::int as count FROM sites"),
    pool.query("SELECT COUNT(*)::int as count FROM articles"),
    pool.query(
      "SELECT COUNT(*)::int as count FROM articles WHERE published_at >= CURRENT_DATE"
    ),
    pool.query(
      "SELECT COALESCE(SUM(views), 0)::bigint as total FROM articles"
    ),
  ]);

  return {
    totalSites: sites.rows[0].count,
    totalArticles: articles.rows[0].count,
    todayArticles: today.rows[0].count,
    totalViews: Number(views.rows[0].total),
  };
}
