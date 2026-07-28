import pool from "@/lib/db";
import { RewriteResult } from "./rewriter";
import { sites as siteConfigs } from "@/config/sites";

// Realistic journalist bylines with titles — like real US newspapers
// Format: "Name, Title" — saved as author field
interface Reporter {
  name: string;
  title: string;
}

const REPORTERS: Record<string, Reporter[]> = {
  "local-news": [
    { name: "Sarah Mitchell", title: "Senior Local Reporter" },
    { name: "James Whitfield", title: "Metro Desk Editor" },
    { name: "Maria Gonzalez", title: "Local News Correspondent" },
    { name: "David Park", title: "Staff Writer" },
    { name: "Emily Richardson", title: "Community Affairs Reporter" },
    { name: "Marcus Johnson", title: "Junior Reporter" },
    { name: "Rachel Kim", title: "City Hall Correspondent" },
    { name: "Thomas O'Brien", title: "Breaking News Reporter" },
    { name: "Angela Davis", title: "Local Desk Editor" },
    { name: "Christopher Lee", title: "Staff Reporter" },
  ],
  "us-news": [
    { name: "Michael Torres", title: "National Correspondent" },
    { name: "Jennifer Walsh", title: "Senior National Reporter" },
    { name: "Robert Chen", title: "Washington Correspondent" },
    { name: "Amanda Foster", title: "National Desk Editor" },
    { name: "Daniel Brooks", title: "Senior Staff Writer" },
    { name: "Katherine Nguyen", title: "National Affairs Reporter" },
    { name: "Brian Sullivan", title: "Staff Writer" },
    { name: "Laura Martinez", title: "Junior National Reporter" },
  ],
  politics: [
    { name: "Patricia Coleman", title: "Senior Political Correspondent" },
    { name: "Andrew Stevens", title: "Political Editor" },
    { name: "Michelle Wang", title: "Capitol Bureau Chief" },
    { name: "Steven Keller", title: "Political Analyst" },
    { name: "Diana Reyes", title: "Politics Reporter" },
    { name: "William Hart", title: "Senior Political Writer" },
    { name: "Samantha Pierce", title: "Government Affairs Reporter" },
    { name: "Jonathan Blake", title: "Junior Political Correspondent" },
  ],
  sports: [
    { name: "Tyler Jackson", title: "Sports Editor" },
    { name: "Nicole Adams", title: "Senior Sports Reporter" },
    { name: "Kevin Murphy", title: "Sports Columnist" },
    { name: "Megan Thompson", title: "Staff Sports Writer" },
    { name: "Derek Williams", title: "Athletics Correspondent" },
    { name: "Ashley Morgan", title: "Sports Desk Reporter" },
    { name: "Ryan Cooper", title: "Junior Sports Writer" },
    { name: "Brittany Hall", title: "Sideline Reporter" },
  ],
  entertainment: [
    { name: "Jessica Lane", title: "Entertainment Editor" },
    { name: "Brandon Cruz", title: "Culture Correspondent" },
    { name: "Olivia Bennett", title: "Arts & Entertainment Reporter" },
    { name: "Nathan Reed", title: "Senior Entertainment Writer" },
    { name: "Sophia Turner", title: "Pop Culture Reporter" },
    { name: "Ethan Price", title: "Staff Entertainment Writer" },
    { name: "Chloe Rivera", title: "Junior Arts Reporter" },
    { name: "Dylan Moore", title: "Media Correspondent" },
  ],
  celebrity: [
    { name: "Vanessa Cole", title: "Celebrity Correspondent" },
    { name: "Jake Morrison", title: "Entertainment Desk Editor" },
    { name: "Isabella Grant", title: "Senior Celebrity Reporter" },
    { name: "Lucas Webb", title: "Hollywood Correspondent" },
    { name: "Hannah Phillips", title: "Celebrity News Writer" },
    { name: "Mason Clark", title: "Pop Culture Editor" },
    { name: "Emma Russo", title: "Staff Celebrity Writer" },
    { name: "Noah Patterson", title: "Junior Entertainment Reporter" },
  ],
  technology: [
    { name: "Alex Sharma", title: "Technology Editor" },
    { name: "Priya Patel", title: "Senior Tech Reporter" },
    { name: "Jason Wu", title: "Silicon Valley Correspondent" },
    { name: "Rebecca Hoffman", title: "Tech Industry Analyst" },
    { name: "Kevin Chang", title: "Digital Trends Reporter" },
    { name: "Mia Rodriguez", title: "Staff Tech Writer" },
    { name: "Daniel Kim", title: "Innovation Correspondent" },
    { name: "Sarah Nakamura", title: "Junior Tech Reporter" },
  ],
  "world-news": [
    { name: "Catherine Banks", title: "Foreign Correspondent" },
    { name: "Gregory Stone", title: "International Editor" },
    { name: "Natalie Herrera", title: "Senior World Affairs Reporter" },
    { name: "Peter Lawson", title: "Global Desk Editor" },
    { name: "Victoria Cross", title: "International Correspondent" },
    { name: "Simon Hayes", title: "World News Analyst" },
    { name: "Gabriella Fox", title: "Staff International Writer" },
    { name: "Adrian Wells", title: "Junior Foreign Correspondent" },
  ],
  lifestyle: [
    { name: "Lauren Hayes", title: "Lifestyle Editor" },
    { name: "Jordan Ellis", title: "Health & Wellness Reporter" },
    { name: "Melissa Green", title: "Senior Features Writer" },
    { name: "Chris Donovan", title: "Lifestyle Correspondent" },
    { name: "Stephanie Ross", title: "Living Section Editor" },
    { name: "Ian Carter", title: "Staff Features Writer" },
    { name: "Heather Quinn", title: "Wellness Columnist" },
    { name: "Mark Fisher", title: "Junior Lifestyle Reporter" },
  ],
  crime: [
    { name: "Frank Doyle", title: "Senior Crime Reporter" },
    { name: "Sandra Vega", title: "Crime & Justice Editor" },
    { name: "Raymond Scott", title: "Investigative Reporter" },
    { name: "Teresa Burke", title: "Court Correspondent" },
    { name: "Gary Palmer", title: "Crime Desk Reporter" },
    { name: "Monica Reeves", title: "Public Safety Correspondent" },
    { name: "Douglas Grant", title: "Staff Crime Writer" },
    { name: "Linda Marsh", title: "Junior Crime Reporter" },
  ],
  business: [
    { name: "Richard Yang", title: "Business Editor" },
    { name: "Caroline Shaw", title: "Senior Financial Reporter" },
    { name: "Jeffrey Morgan", title: "Wall Street Correspondent" },
    { name: "Diane Fletcher", title: "Economy Reporter" },
    { name: "Philip Reed", title: "Markets Analyst" },
    { name: "Alicia Barnes", title: "Business Desk Editor" },
    { name: "Howard Klein", title: "Staff Business Writer" },
    { name: "Margaret Chen", title: "Junior Financial Reporter" },
  ],
  opinion: [
    { name: "James Whitfield", title: "Senior Editorial Writer" },
    { name: "Sarah Mitchell", title: "Opinion Columnist" },
    { name: "David Chen", title: "Contributing Editor" },
    { name: "Maria Rodriguez", title: "Editorial Board Member" },
    { name: "Robert Thompson", title: "Guest Columnist" },
  ],
};

const DEFAULT_REPORTERS: Reporter[] = [
  { name: "Staff Reporter", title: "News Desk" },
];

function getReporter(category: string): string {
  const reporters = REPORTERS[category] || DEFAULT_REPORTERS;
  const reporter = reporters[Math.floor(Math.random() * reporters.length)];
  return `${reporter.name}, ${reporter.title}`;
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
  // Quality gate — never publish thin/empty articles. A malformed LLM
  // response must not become a live, sitemap-included NewsArticle page.
  const plainText = (opts.rewrite.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!opts.rewrite.title || opts.rewrite.title.trim().length < 15 || plainText.length < 1500) {
    console.error(
      `Rejected thin article (title ${opts.rewrite.title?.length || 0} chars, body ${plainText.length} chars) for state: ${opts.state}`
    );
    return 0;
  }

  const slug = slugify(opts.rewrite.title);
  const author = opts.author || getReporter(opts.category);
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
      return 0;
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
      return 0;
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
      return 1;
    }

    return 0; // Duplicate slug
  } catch (error) {
    console.error(`Publish failed for state ${opts.state}:`, error);
    return 0;
  }
}
