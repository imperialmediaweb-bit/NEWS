import pool from "@/lib/db";

/** This site's own recent stories matching a topic pattern, so each utility page carries its own news. */
export async function siteStories(siteSlug: string, pattern: string, days = 21, limit = 6) {
  try {
    const { rows } = await pool.query(
      `SELECT a.title, a.slug, a.category, a.published_at FROM articles a JOIN sites s ON s.id = a.site_id
        WHERE s.slug = $1 AND a.published_at > now() - ($2 || ' days')::interval AND a.title ~* $3
        ORDER BY a.published_at DESC LIMIT $4`,
      [siteSlug, String(days), pattern, limit]
    );
    return rows as { title: string; slug: string; category: string; published_at: string }[];
  } catch {
    return [];
  }
}

export const storyHref = (a: { category: string; slug: string }) => `/${(a.category || "local-news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;
