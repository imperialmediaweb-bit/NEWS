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
  // Public radio on NPR's CMS, which a lot of the state-level nonprofits use.
  "/api/rss",
  "/rss/news",
  "/news/feed/",
  "/local/feed/",
  "/local-news/feed/",
  "/politics/feed/",
  "/index.xml",
  "/atom.xml",
];

/**
 * Every publisher that answers at all declares its feeds in the page head:
 *
 *   <link rel="alternate" type="application/rss+xml" href="…">
 *
 * Guessing paths found one feed per publisher at best, and missed outright
 * every site whose feed is not at a conventional path — which is why seven
 * states ended up with a single feed and stopped producing articles. Reading
 * the declaration finds those, and finds a publisher's section feeds, which
 * is what turns one feed into four.
 */
function declaredFeeds(html, domain) {
  const found = [];
  const links = html.match(/<link[^>]+>/gi) || [];
  for (const tag of links) {
    if (!/rel=["']?alternate/i.test(tag)) continue;
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      const url = new URL(href, `https://${domain}`);
      // Stay on the publisher: an alternate link can point at a syndication
      // service, and a feed we cannot attribute to a state publisher is no
      // use to us.
      if (!url.hostname.endsWith(domain.replace(/^www\./, ""))) continue;
      // Comment feeds are WordPress noise, never articles.
      if (/\/comments\/feed|comment-rss|\?feed=comments/i.test(url.href)) continue;
      found.push(url.href);
    } catch {
      // Malformed href; nothing to recover.
    }
  }
  return [...new Set(found)];
}

/**
 * Minimum characters of article text an item must average before the feed is
 * worth using. Matches MIN_SOURCE_CHARS in the rewrite route: below this the
 * model is filling in rather than reporting.
 */
const MIN_TEXT = 500;

/**
 * Above this, the item is not an article.
 *
 * A long investigative piece runs 12,000 characters. Cape Gazette's feed
 * measured 29,000 per item because each one is the whole rendered page —
 * navigation, a "Most Popular" sidebar, and inline ad-slot JavaScript — with
 * maybe five hundred characters of story inside it. That measured as the
 * richest feed in the run and would have been handed to the model as the
 * source to report from, which is exactly how a feed produces articles about
 * nothing. A feed serving pages instead of articles is worse than no feed.
 */
const MAX_TEXT = 20000;

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

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * Plain text, with the markup actually gone.
 *
 * Stripping tags before decoding entities leaves escaped markup behind as
 * literal text, and some publishers escape their HTML twice: Cape Gazette's
 * items arrive as `&amp;lt;span class="field field-name-title"&amp;gt;`, so
 * one strip-then-decode pass measured 5,200 characters of article as 135,000
 * characters of Drupal field markup — by far the richest feed in the run, and
 * entirely noise. Decoding first and repeating until the text settles handles
 * both depths; &amp; is decoded last so it cannot manufacture a new entity.
 */
function stripTags(s) {
  let out = s;
  for (let pass = 0; pass < 3; pass++) {
    // Script and style bodies are not markup — dropping the tags alone leaves
    // the JavaScript behind as prose.
    const stripped = decodeEntities(out)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    if (stripped === out) break;
    out = stripped;
  }
  return out.replace(/\s+/g, " ").trim();
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
  const usable = lengths.filter((l) => l >= MIN_TEXT && l <= MAX_TEXT).length;

  return {
    items: items.length,
    medianChars: median,
    maxChars: lengths[0] || 0,
    usableShare: Number((usable / lengths.length).toFixed(2)),
    // WordPress answers /feed/, /rss/ and ?feed=rss2 with the same feed, and
    // a publisher's "news" and "local" sections often differ only in name.
    // Counting those as separate feeds is how a state looks covered while
    // actually having one source. Identity is what the feed contains.
    identity: fingerprint(items),
  };
}

/** The first few item links — same links, same feed, whatever the URL says. */
function fingerprint(items) {
  return items
    .slice(0, 3)
    .map(
      (i) =>
        i.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/)?.[1] ||
        i.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1] ||
        i.match(/<link[^>]+href=["']([^"']+)["']/)?.[1] ||
        ""
    )
    .map((s) => s.trim())
    .join("|");
}

/** How many feeds to keep from one publisher, best first. */
const MAX_PER_DOMAIN = 3;

/**
 * Every feed this publisher has that carries enough text to write from.
 *
 * Returning all of them rather than the first is the point: a state served by
 * one feed runs dry the moment that publisher has a quiet day, and the
 * pipeline then shows "pending 0, failed 0" — nothing wrong, nothing to do.
 */
async function probeDomain(domain) {
  const urls = [];

  const home = await get(`https://${domain}/`, 12000);
  if (home) urls.push(...declaredFeeds(home, domain));
  for (const path of FEED_PATHS) urls.push(`https://${domain}${path}`);

  const seen = new Set();
  const identities = new Set();
  const feeds = [];
  for (const url of urls) {
    const normalised = url.replace(/\/$/, "");
    if (seen.has(normalised)) continue;
    seen.add(normalised);

    const xml = await get(url);
    if (!xml || !/<rss|<feed|<item>/i.test(xml)) continue;
    const stats = analyse(xml);
    if (!stats) continue;
    if (stats.identity && identities.has(stats.identity)) continue;
    if (stats.identity) identities.add(stats.identity);
    feeds.push({ domain, feed: url, ...stats });

    // Stop once this publisher has given us enough: the rest of its sections
    // repeat the same stories, and we are being polite about it.
    if (
      feeds.filter((f) => f.medianChars >= MIN_TEXT && f.medianChars <= MAX_TEXT)
        .length >= MAX_PER_DOMAIN
    )
      break;
  }

  return feeds.length ? feeds : [{ domain, feed: null }];
}

async function probeState(state) {
  const domains = CANDIDATES[state.toLowerCase()];
  if (!domains) {
    console.error(`No candidate list for "${state}" — add one to feed-candidates.mjs`);
    return { state, usable: [], weak: [], pages: [], none: [] };
  }

  const results = [];
  // A few at a time: polite to the publishers, and fast enough for 50 states.
  for (let i = 0; i < domains.length; i += 4) {
    const group = domains.slice(i, i + 4);
    const found = await Promise.all(group.map(probeDomain));
    results.push(...found.flat());
  }

  // Two publishers can carry the same syndicated feed, so dedupe by content
  // across the whole state as well as within each publisher.
  const dedup = new Map();
  for (const r of results) {
    if (!r.feed) continue;
    const key = r.identity || r.feed;
    if (!dedup.has(key)) dedup.set(key, r);
  }
  const withFeed = [...dedup.values()];

  return {
    state,
    usable: withFeed
      .filter((r) => r.medianChars >= MIN_TEXT && r.medianChars <= MAX_TEXT)
      .sort((a, b) => b.medianChars - a.medianChars),
    weak: withFeed.filter((r) => r.medianChars < MIN_TEXT),
    // Not short — the wrong shape. These carry whole pages, not articles.
    pages: withFeed.filter((r) => r.medianChars > MAX_TEXT),
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
    ).padStart(2)}  pages ${String((r.pages || []).length).padStart(2)}  none ${r.none.length}`
  );
  for (const u of r.usable) {
    console.error(`    ${u.feed}  median ${u.medianChars} chars, ${u.items} items`);
  }
  // Worth naming: a feed serving whole pages looks like the richest one in
  // the run, so without this it reads as a feed we inexplicably skipped.
  for (const p of r.pages || []) {
    console.error(`    rejected (whole pages, not articles): ${p.feed}  ${p.medianChars} chars`);
  }
}

console.log(JSON.stringify(all, null, 2));
