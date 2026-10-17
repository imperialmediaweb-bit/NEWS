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
/**
 * Which layer rejected an item, or "" if it is new.
 *
 * The two layers mean completely different things and the fix for each is the
 * opposite of the other. A GUID hit means we have genuinely seen this exact
 * article before — correct, and most of what a feed returns on any run after
 * the first. A title-similarity hit is a judgement call at a threshold, and a
 * threshold set too low silently discards distinct stories. Returning a bare
 * boolean made the two indistinguishable, and three states that queued
 * nothing for weeks could not be diagnosed because of it.
 */
export type DuplicateReason = "" | "guid" | "title";

/**
 * Which state already holds the GUID that just matched.
 *
 * Module-level rather than part of the return value because the fetch loop is
 * strictly sequential per item — it awaits each check before the next — so
 * there is no interleaving to get this wrong. It is diagnostic only; nothing
 * branches on it.
 */
let lastGuidHolder = "";

export function guidHolder(): string {
  return lastGuidHolder;
}

export async function duplicateReason(
  item: FeedItem,
  ctx?: DedupContext
): Promise<DuplicateReason> {
  const guid = generateGuid(item);

  // Layer 1: GUID check.
  //
  // Deliberately not scoped to a state, and the state it IS filed under is
  // reported back: the nonprofit state newsrooms republish each other, so the
  // same article arrives in several states' feeds and whichever state is
  // processed first claims it. That is the intended outcome for wire copy —
  // fifty sites running one story is the pattern this network must not match
  // — but it also means a state whose feeds are mostly syndicated gets
  // nothing at all, and from the outside that is indistinguishable from a
  // broken feed. Naming the holder is what tells the two apart.
  const { rows: guidRows } = await pool.query(
    "SELECT state FROM feed_items WHERE guid = $1 LIMIT 1",
    [guid]
  );
  if (guidRows.length > 0) {
    lastGuidHolder = (guidRows[0].state as string) || "(none)";
    return "guid";
  }

  // Layer 2: title similarity against recent items. Callers should pass a
  // DedupContext so the 48h lookback is fetched and normalized ONCE per run
  // instead of per item (it used to be a full scan + 200 re-normalizations
  // for every single feed item — ~79k queries and ~8M string ops a day).
  const context = ctx ?? (await loadDedupContext());

  const itemWords = normalizeTitle(item.title);
  for (const recentWords of context.recentTitleWords) {
    if (jaccardSimilarity(itemWords, recentWords) > 0.7) {
      return "title";
    }
  }

  // Keep the current title in play so duplicates *within* this run are caught.
  context.recentTitleWords.push(itemWords);

  return "";
}

export async function isDuplicate(item: FeedItem, ctx?: DedupContext): Promise<boolean> {
  return (await duplicateReason(item, ctx)) !== "";
}

export interface DedupContext {
  recentTitleWords: Set<string>[];
}

/** Fetch + normalize the 48h title window once, for reuse across a fetch run. */
export async function loadDedupContext(): Promise<DedupContext> {
  const { rows } = await pool.query(
    `SELECT title FROM feed_items
     WHERE created_at > NOW() - INTERVAL '48 hours'
     ORDER BY created_at DESC LIMIT 200`
  );
  return {
    recentTitleWords: rows.map((r: { title: string }) => normalizeTitle(r.title)),
  };
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
