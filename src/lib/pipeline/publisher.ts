import pool from "@/lib/db";
import { RewriteResult } from "./rewriter";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

interface PublishOptions {
  feedItemId: number;
  rewrite: RewriteResult;
  category: string;
  sourceUrl: string;
  imageUrl: string | null;
  state: string;
  author?: string;
}

/**
 * Publish a rewritten article to the single site matching the state.
 * Every article is unique per state — no cross-site publishing.
 * Returns 1 on success, 0 on failure/duplicate.
 */
export async function publishArticle(opts: PublishOptions): Promise<number> {
  const slug = slugify(opts.rewrite.title);
  const author = opts.author || "Staff Reporter";
  const now = new Date().toISOString();

  // Find the one site matching this state
  const { rows: siteRows } = await pool.query(
    "SELECT id FROM sites WHERE state = $1 LIMIT 1",
    [opts.state]
  );
  if (siteRows.length === 0) {
    console.error(`No site found for state: ${opts.state}`);
    return 0;
  }

  const siteId = siteRows[0].id;

  try {
    const { rowCount } = await pool.query(
      `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, source_url, auto_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (site_id, slug) DO NOTHING`,
      [
        siteId,
        opts.rewrite.title,
        slug,
        opts.rewrite.content,
        opts.rewrite.summary,
        opts.category,
        author,
        opts.imageUrl,
        now,
        opts.sourceUrl,
        true,
      ]
    );

    if ((rowCount ?? 0) > 0) {
      // Mark feed item as rewritten
      await pool.query(
        "UPDATE feed_items SET status = 'rewritten' WHERE id = $1",
        [opts.feedItemId]
      );
      return 1;
    }

    return 0; // Duplicate slug
  } catch (error) {
    console.error(`Publish failed for state ${opts.state}:`, error);
    return 0;
  }
}
