#!/usr/bin/env node
/**
 * Find RSS feeds that actually carry article text.
 *
 * The pipeline was built on Google News RSS, which gives a headline, a
 * sentence, and a link wrapped in an opaque news.google.com identifier. The
 * publisher's URL used to be base64 inside that identifier; it is now an
 * opaque token, and the internal endpoint that resolved it returns an error.
 * So there was no way to reach the source article — which meant the model was
 * writing from two sentences and inventing the rest.
 *
 * Publishers' own feeds give the real article URL. But fetching the article
 * often fails anyway: WKRG answers a bot with 403 and a PerimeterX captcha.
 *
 * What does work is that some feeds carry the whole article inside them, in
 * <content:encoded> or a long <description>. WSFA's items run 1,700-3,600
 * characters; al.com's run 130-330. One WSFA is worth twenty al.coms, and no
 * scraping is involved.
 *
 * So this does not ask "does this site have a feed". It asks "does this feed
 * contain enough text to write from", and reports only those.
 *
 *   node scripts/find-feeds.mjs alabama texas
 *   node scripts/find-feeds.mjs --all > feeds-found.json
 */

import { CANDIDATES } from "./feed-candidates.mjs";

/** Where feeds live, in rough order of how often each is the one. */
const FEED_PATHS = [
  "/feed/",
  "/arc/outboundfeeds/rss/?outputType=xml",
  "/rss/",
  "/rss.xml",
  "/feeds/rss",
  "/feed",
  "/index.rss",
];

/**
 * Minimum characters of article text an item must average before the feed is
 * worth using. Matches MIN_SOURCE_CHARS in the rewrite route: below this the
 * model is filling in rather than reporting.
 */
const MIN_TEXT = 500;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function get(url, timeoutMs = 15000) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** The longest text this item carries, from whichever field holds it. */
function itemText(item) {
  const fields = [
    /<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/,
    /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/,
    /<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/,
    /<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/,
  ];
  let best = "";
  for (const re of fields) {
    const m = item.match(re);
    if (m) {
      const text = stripTags(m[1]);
      if (text.length > best.length) best = text;
    }
  }
  return best;
}

function analyse(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/g) || [];
  if (items.length === 0) return null;

  const lengths = items.slice(0, 12).map((i) => itemText(i).length).sort((a, b) => b - a);
  const median = lengths[Math.floor(lengths.length / 2)] || 0;
  const usable = lengths.filter((l) => l >= MIN_TEXT).length;

  return {
    items: items.length,
    medianChars: median,
    maxChars: lengths[0] || 0,
    usableShare: Number((usable / lengths.length).toFixed(2)),
  };
}

async function probeDomain(domain) {
  for (const path of FEED_PATHS) {
    const url = `https://${domain}${path}`;
    const xml = await get(url);
    if (!xml || !/<rss|<feed|<item>/i.test(xml)) continue;

    const stats = analyse(xml);
    if (!stats) continue;
    return { domain, feed: url, ...stats };
  }
  return { domain, feed: null };
}

async function probeState(state) {
  const domains = CANDIDATES[state.toLowerCase()];
  if (!domains) {
    console.error(`No candidate list for "${state}" — add one to feed-candidates.mjs`);
    return { state, usable: [], weak: [], none: [] };
  }

  const results = [];
  // A few at a time: polite to the publishers, and fast enough for 50 states.
  for (let i = 0; i < domains.length; i += 4) {
    const group = domains.slice(i, i + 4);
    results.push(...(await Promise.all(group.map(probeDomain))));
  }

  return {
    state,
    usable: results.filter((r) => r.feed && r.medianChars >= MIN_TEXT),
    weak: results.filter((r) => r.feed && r.medianChars < MIN_TEXT),
    none: results.filter((r) => !r.feed).map((r) => r.domain),
  };
}

const args = process.argv.slice(2);
const states = args.includes("--all") ? Object.keys(CANDIDATES) : args;

if (states.length === 0) {
  console.error("Usage: node scripts/find-feeds.mjs <state> [state...]   |   --all");
  process.exit(1);
}

const all = [];
for (const state of states) {
  const r = await probeState(state);
  all.push(r);

  // Progress to stderr so stdout stays clean JSON when piped to a file.
  console.error(
    `${state.padEnd(16)} usable ${String(r.usable.length).padStart(2)}  weak ${String(
      r.weak.length
    ).padStart(2)}  none ${r.none.length}`
  );
  for (const u of r.usable) {
    console.error(`    ${u.feed}  median ${u.medianChars} chars, ${u.items} items`);
  }
}

console.log(JSON.stringify(all, null, 2));
