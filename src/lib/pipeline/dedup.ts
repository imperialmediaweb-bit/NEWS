import { createHash } from "crypto";
import pool from "@/lib/db";
import { FeedItem } from "./rss-parser";

export function generateGuid(item: FeedItem): string {
  if (item.guid && item.guid !== item.link) {
    return item.guid;
  }
  return createHash("sha256").update(item.link).digest("hex");
}

/**
 * Normalize a title for similarity comparison:
 * lowercase, strip punctuation, remove common stop words
 */
function normalizeTitle(title: string): Set<string> {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "and", "or", "but", "not", "has",
    "had", "have", "been", "will", "be", "can", "do", "does", "did", "it",
    "its", "this", "that", "as", "if", "so", "no", "up", "out", "about",
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Jaccard similarity between two word sets
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  Array.from(a).forEach((word) => {
    if (b.has(word)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if a feed item is a duplicate.
 * Returns true if duplicate (should be skipped).
 */
export async function isDuplicate(item: FeedItem): Promise<boolean> {
  const guid = generateGuid(item);

  // Layer 1: GUID check
  const { rows: guidRows } = await pool.query(
    "SELECT id FROM feed_items WHERE guid = $1",
    [guid]
  );
  if (guidRows.length > 0) return true;

  // Layer 2: Title similarity check against recent items (48h)
  const { rows: recentItems } = await pool.query(
    `SELECT title FROM feed_items
     WHERE created_at > NOW() - INTERVAL '48 hours'
     ORDER BY created_at DESC LIMIT 200`
  );

  const itemWords = normalizeTitle(item.title);
  for (const recent of recentItems) {
    const recentWords = normalizeTitle(recent.title);
    if (jaccardSimilarity(itemWords, recentWords) > 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Insert a feed item into the queue, returning the new ID or null if duplicate.
 */
export async function insertFeedItem(
  item: FeedItem,
  feedId: string,
  category: string,
  state: string | null
): Promise<number | null> {
  const guid = generateGuid(item);

  try {
    const { rows } = await pool.query(
      `INSERT INTO feed_items (guid, source_feed, source_url, title, description, category, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (guid) DO NOTHING
       RETURNING id`,
      [guid, feedId, item.link, item.title, item.description, category, state]
    );
    return rows.length > 0 ? rows[0].id : null;
  } catch {
    return null;
  }
}
