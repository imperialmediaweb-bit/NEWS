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
  scope: "local" | "national" | "world";
  state: string | null;
  author?: string;
}

/**
 * Publish a rewritten article to the appropriate sites.
 * Local → 1 site; National/World → all 50 sites.
 * Returns the number of articles published.
 */
export async function publishArticle(opts: PublishOptions): Promise<number> {
  const slug = slugify(opts.rewrite.title);
  const author = opts.author || "Staff Reporter";
  const now = new Date().toISOString();

  if (opts.scope === "local" && opts.state) {
    // Find the one site matching this state
    const { rows: sites } = await pool.query(
      "SELECT id FROM sites WHERE state = $1 LIMIT 1",
      [opts.state]
    );
    if (sites.length === 0) return 0;

    return await insertArticle(
      sites[0].id,
      opts,
      slug,
      author,
      now
    );
  }

  // National or World: publish to ALL sites
  const { rows: allSites } = await pool.query(
    "SELECT id FROM sites ORDER BY id"
  );

  if (allSites.length === 0) return 0;

  // Batch insert using multi-row VALUES for efficiency
  const batchSize = 50;
  let published = 0;

  for (let i = 0; i < allSites.length; i += batchSize) {
    const batch = allSites.slice(i, i + batchSize);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let paramIdx = 1;

    for (const site of batch) {
      placeholders.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      values.push(
        site.id,
        opts.rewrite.title,
        slug,
        opts.rewrite.content,
        opts.rewrite.summary,
        opts.category,
        author,
        opts.imageUrl,
        now,
        opts.sourceUrl,
        true // auto_generated
      );
    }

    try {
      const { rowCount } = await pool.query(
        `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, source_url, auto_generated)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT (site_id, slug) DO NOTHING`,
        values
      );
      published += rowCount ?? 0;
    } catch (error) {
      console.error(`Batch insert failed for sites ${i}-${i + batch.length}:`, error);
    }
  }

  // Update feed_item status
  await pool.query(
    "UPDATE feed_items SET status = 'rewritten' WHERE id = $1",
    [opts.feedItemId]
  );

  return published;
}

async function insertArticle(
  siteId: number,
  opts: PublishOptions,
  slug: string,
  author: string,
  now: string
): Promise<number> {
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
      await pool.query(
        "UPDATE feed_items SET status = 'rewritten' WHERE id = $1",
        [opts.feedItemId]
      );
    }

    return rowCount ?? 0;
  } catch {
    return 0;
  }
}
