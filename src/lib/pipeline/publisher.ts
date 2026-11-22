import pool from "@/lib/db";
import { RewriteResult } from "./rewriter";
import { sites as siteConfigs } from "@/config/sites";

/** Byline for stories the newsroom publishes: "{Site name} Newsroom". */
export function newsroomByline(state: string): string {
  const cfg = Object.values(siteConfigs).find((x) => x.state === state);
  return `${cfg?.name || "Express"} Newsroom`;
}

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

export interface PublishResult {
  published: number;
  /** Why it was not published. Present only on a 0. */
  reason?: string;
}

/**
 * Publish a rewritten article to the single site matching the state.
 * Every article is unique per state — no cross-site publishing.
 *
 * Returns a reason alongside the count. Returning a bare 0 meant a rejected
 * article was indistinguishable from a duplicate slug or a missing site row,
 * and the pipeline published nothing for days while every layer above
 * reported success.
 */
export async function publishArticle(opts: PublishOptions): Promise<PublishResult> {
  // Quality gate — never publish an empty or malformed LLM response as a live,
  // sitemap-included NewsArticle page.
  //
  // The floor used to be 1,500 characters, from when the prompt demanded
  // 800-1500 words of every story. The prompt now asks for 150-250 words when
  // the source material is thin, and says so is correct — so that floor
  // silently rejected essentially everything the new prompt produced, and the
  // network published nothing for two days. 600 characters still catches an
  // empty or truncated response without punishing an article for being short
  // and true.
  const plainText = (opts.rewrite.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!opts.rewrite.title || opts.rewrite.title.trim().length < 15 || plainText.length < 600) {
    const reason = `Rejected as thin: title ${opts.rewrite.title?.length || 0} chars, body ${plainText.length} chars (needs title >= 15, body >= 600)`;
    console.error(`${reason} for state: ${opts.state}`);
    return { published: 0, reason };
  }

  const slug = slugify(opts.rewrite.title);
  // the newsroom signs its stories; no invented personal bylines
  const author = opts.author || newsroomByline(opts.state);
  const now = new Date().toISOString();

  // Find the one site matching this state
  const { rows: siteRows } = await pool.query(
    "SELECT id FROM sites WHERE state = $1 LIMIT 1",
    [opts.state]
  );

  let siteId: number;
  if (siteRows.length > 0) {
    siteId = siteRows[0].id;
  } else {
    // Self-heal: seed the site row from config instead of bailing, so the
    // pipeline works even if the sites table was never seeded.
    const cfg = Object.values(siteConfigs).find((s) => s.state === opts.state);
    if (!cfg) {
      console.error(`No site config for state: ${opts.state}`);
      return { published: 0, reason: `No site config for state ${opts.state}` };
    }
    const { rows: created } = await pool.query(
      `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET domain = EXCLUDED.domain
       RETURNING id`,
      [cfg.slug, cfg.domain, cfg.name, cfg.logoFirst, cfg.logoSecond,
       cfg.city, cfg.state, cfg.stateAbbr, cfg.tagline]
    );
    if (created.length === 0) {
      console.error(`Failed to seed site for state: ${opts.state}`);
      return { published: 0, reason: `Could not seed site row for ${opts.state}` };
    }
    siteId = created[0].id;
  }

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
      return { published: 1 };
    }

    return { published: 0, reason: `Duplicate slug: ${slug}` };
  } catch (error) {
    console.error(`Publish failed for state ${opts.state}:`, error);
    return {
      published: 0,
      reason: `Insert failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
