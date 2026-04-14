import pool from "./db";

export interface FbSiteRow {
  id: number;
  slug: string;
  domain: string;
  name: string;
  fb_page_id: string | null;
  fb_page_name: string | null;
  fb_access_token: string | null;
  fb_posting_enabled: boolean;
  fb_last_posted_at: string | null;
  fb_token_expires_at: string | null;
}

export interface FbPostRow {
  id: number;
  site_id: number;
  article_id: number;
  fb_post_id: string | null;
  status: string;
  error_message: string | null;
  posted_at: string;
}

export async function listSitesWithFbInfo(): Promise<FbSiteRow[]> {
  const { rows } = await pool.query<FbSiteRow>(
    `SELECT id, slug, domain, name,
            fb_page_id, fb_page_name, fb_access_token,
            COALESCE(fb_posting_enabled, false) AS fb_posting_enabled,
            fb_last_posted_at, fb_token_expires_at
       FROM sites
       ORDER BY name`
  );
  return rows;
}

export async function getActiveFbSites(): Promise<FbSiteRow[]> {
  const { rows } = await pool.query<FbSiteRow>(
    `SELECT id, slug, domain, name,
            fb_page_id, fb_page_name, fb_access_token,
            fb_posting_enabled, fb_last_posted_at, fb_token_expires_at
       FROM sites
      WHERE fb_posting_enabled = true
        AND fb_page_id IS NOT NULL
        AND fb_access_token IS NOT NULL`
  );
  return rows;
}

export async function updateSiteFbMapping(
  siteId: number,
  fbPageId: string | null,
  fbPageName: string | null,
  fbAccessToken: string | null,
  enabled: boolean
): Promise<void> {
  await pool.query(
    `UPDATE sites
        SET fb_page_id = $2,
            fb_page_name = $3,
            fb_access_token = $4,
            fb_posting_enabled = $5
      WHERE id = $1`,
    [siteId, fbPageId, fbPageName, fbAccessToken, enabled]
  );
}

export async function setSiteFbPosted(siteId: number, when: Date): Promise<void> {
  await pool.query(`UPDATE sites SET fb_last_posted_at = $2 WHERE id = $1`, [siteId, when]);
}

export async function findNextArticleToPost(
  siteId: number
): Promise<{ id: number; title: string; slug: string; summary: string | null } | null> {
  // Newest article that has NOT been posted to FB yet
  const { rows } = await pool.query<{ id: number; title: string; slug: string; summary: string | null }>(
    `SELECT a.id, a.title, a.slug, a.summary
       FROM articles a
       LEFT JOIN fb_posts p
         ON p.article_id = a.id AND p.site_id = a.site_id
      WHERE a.site_id = $1 AND p.id IS NULL
      ORDER BY a.published_at DESC
      LIMIT 1`,
    [siteId]
  );
  return rows[0] ?? null;
}

export async function recordFbPost(
  siteId: number,
  articleId: number,
  fbPostId: string | null,
  status: "success" | "error",
  errorMessage: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO fb_posts (site_id, article_id, fb_post_id, status, error_message)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (site_id, article_id) DO UPDATE
       SET fb_post_id = EXCLUDED.fb_post_id,
           status = EXCLUDED.status,
           error_message = EXCLUDED.error_message,
           posted_at = NOW()`,
    [siteId, articleId, fbPostId, status, errorMessage]
  );
}

export async function getRecentFbPosts(limit = 50): Promise<
  (FbPostRow & { site_name: string; article_title: string })[]
> {
  const { rows } = await pool.query(
    `SELECT p.*, s.name AS site_name, a.title AS article_title
       FROM fb_posts p
       JOIN sites s ON s.id = p.site_id
       JOIN articles a ON a.id = p.article_id
      ORDER BY p.posted_at DESC
      LIMIT $1`,
    [limit]
  );
  return rows;
}
