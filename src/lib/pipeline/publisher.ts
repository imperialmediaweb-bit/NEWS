import pool from "@/lib/db";
import { RewriteResult } from "./rewriter";

// Realistic journalist bylines — diverse, American-sounding names
// Each category has its own pool of "beat reporters"
const REPORTERS: Record<string, string[]> = {
  "local-news": [
    "Sarah Mitchell", "James Whitfield", "Maria Gonzalez", "David Park",
    "Emily Richardson", "Marcus Johnson", "Rachel Kim", "Thomas O'Brien",
    "Angela Davis", "Christopher Lee",
  ],
  "us-news": [
    "Michael Torres", "Jennifer Walsh", "Robert Chen", "Amanda Foster",
    "Daniel Brooks", "Katherine Nguyen", "Brian Sullivan", "Laura Martinez",
  ],
  politics: [
    "Patricia Coleman", "Andrew Stevens", "Michelle Wang", "Steven Keller",
    "Diana Reyes", "William Hart", "Samantha Pierce", "Jonathan Blake",
  ],
  sports: [
    "Tyler Jackson", "Nicole Adams", "Kevin Murphy", "Megan Thompson",
    "Derek Williams", "Ashley Morgan", "Ryan Cooper", "Brittany Hall",
  ],
  entertainment: [
    "Jessica Lane", "Brandon Cruz", "Olivia Bennett", "Nathan Reed",
    "Sophia Turner", "Ethan Price", "Chloe Rivera", "Dylan Moore",
  ],
  celebrity: [
    "Vanessa Cole", "Jake Morrison", "Isabella Grant", "Lucas Webb",
    "Hannah Phillips", "Mason Clark", "Emma Russo", "Noah Patterson",
  ],
  technology: [
    "Alex Sharma", "Priya Patel", "Jason Wu", "Rebecca Hoffman",
    "Kevin Chang", "Mia Rodriguez", "Daniel Kim", "Sarah Nakamura",
  ],
  "world-news": [
    "Catherine Banks", "Gregory Stone", "Natalie Herrera", "Peter Lawson",
    "Victoria Cross", "Simon Hayes", "Gabriella Fox", "Adrian Wells",
  ],
  lifestyle: [
    "Lauren Hayes", "Jordan Ellis", "Melissa Green", "Chris Donovan",
    "Stephanie Ross", "Ian Carter", "Heather Quinn", "Mark Fisher",
  ],
  crime: [
    "Frank Doyle", "Sandra Vega", "Raymond Scott", "Teresa Burke",
    "Gary Palmer", "Monica Reeves", "Douglas Grant", "Linda Marsh",
  ],
  business: [
    "Richard Yang", "Caroline Shaw", "Jeffrey Morgan", "Diane Fletcher",
    "Philip Reed", "Alicia Barnes", "Howard Klein", "Margaret Chen",
  ],
  opinion: [
    "James Whitfield", "Sarah Mitchell", "David Chen",
    "Maria Rodriguez", "Robert Thompson",
  ],
};

const DEFAULT_REPORTERS = [
  "Staff Reporter", "News Desk", "Editorial Team",
];

function getReporter(category: string): string {
  const pool = REPORTERS[category] || DEFAULT_REPORTERS;
  return pool[Math.floor(Math.random() * pool.length)];
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

/**
 * Publish a rewritten article to the single site matching the state.
 * Every article is unique per state — no cross-site publishing.
 * Returns 1 on success, 0 on failure/duplicate.
 */
export async function publishArticle(opts: PublishOptions): Promise<number> {
  const slug = slugify(opts.rewrite.title);
  const author = opts.author || getReporter(opts.category);
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
