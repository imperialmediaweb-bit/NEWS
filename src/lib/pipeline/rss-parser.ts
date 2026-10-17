import { XMLParser } from "fast-xml-parser";

export interface FeedItem {
  guid: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

/** The longest of several candidate fields — whichever actually holds the article. */
function longest(candidates: string[]): string {
  return candidates.reduce((best, c) => (c.length > best.length ? c : best), "");
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // fast-xml-parser caps entity expansions at 1,000 per document to stop a
  // "billion laughs" attack. That cap is far too tight for a real feed: LAist
  // publishes 100 items and every apostrophe and ampersand in them counts, so
  // it hit 1,052 and the whole California feed was thrown away with
  // "Entity expansion limit exceeded" — an error that looks like a broken
  // publisher and is not.
  //
  // The guard that actually matters against that attack is expansion DEPTH,
  // which stays at its default of 10: nesting is what makes the blowup
  // exponential. Raising the count and the total expanded size only allows a
  // long document, which is what a news feed is.
  processEntities: {
    enabled: true,
    maxTotalExpansions: 100_000,
    maxExpandedLength: 8_000_000,
  },
});

export async function parseFeed(url: string): Promise<FeedItem[]> {
  // Use a real browser User-Agent — Google News blocks non-browser requests
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error(`Feed fetch failed: ${res.status} for ${url}`);
    return []; // Return empty instead of throwing — don't break the whole batch
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);

  // Handle RSS 2.0
  const channel = parsed?.rss?.channel;
  if (!channel) {
    // Try Atom format
    const feed = parsed?.feed;
    if (feed?.entry) {
      return normalizeAtom(feed.entry);
    }
    return [];
  }

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  return items.map((item: Record<string, unknown>) => ({
    guid: extractText(item.guid) || extractText(item.link) || "",
    title: stripCDATA(extractText(item.title) || ""),
    link: extractText(item.link) || "",
    // Prefer <content:encoded>, which is where a feed puts the full article.
    // Taking <description> alone threw the article away and kept the teaser —
    // and the teaser is not enough to write from, so the model filled the rest
    // in. On the feeds worth using this is the difference between 130
    // characters and 5,500.
    description: longest([
      stripCDATA(extractText(item["content:encoded"]) || ""),
      stripCDATA(extractText(item.content) || ""),
      stripCDATA(extractText(item.description) || ""),
    ]),
    pubDate: extractText(item.pubDate) || "",
    source: extractText(item.source) || "",
  }));
}

function normalizeAtom(entries: unknown[]): FeedItem[] {
  const items = Array.isArray(entries) ? entries : [entries];
  return items.map((entry: unknown) => {
    const e = entry as Record<string, unknown>;
    const link =
      typeof e.link === "object" && e.link !== null
        ? (e.link as Record<string, string>)["@_href"] || ""
        : String(e.link || "");
    return {
      guid: String(e.id || link),
      title: stripCDATA(String(e.title || "")),
      link,
      description: longest([
        stripCDATA(extractText(e.content) || ""),
        stripCDATA(extractText(e.summary) || ""),
      ]),
      pubDate: String(e.updated || e.published || ""),
      source: "",
    };
  });
}

/**
 * Extract text from XML node — handles both strings and objects like
 * { "@_isPermaLink": "false", "#text": "actual-guid-value" }
 */
function extractText(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    // fast-xml-parser puts text content in "#text" when attributes exist
    if ("#text" in obj) return String(obj["#text"]);
    // For <link> with href attribute (Atom)
    if ("@_href" in obj) return String(obj["@_href"]);
    // Fallback: try to get any string value
    const values = Object.values(obj).filter((v) => typeof v === "string");
    return values.length > 0 ? String(values[0]) : "";
  }
  return String(node);
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#8216;": "\u2018",
    "&#8217;": "\u2019",
    "&#8220;": "\u201C",
    "&#8221;": "\u201D",
    "&#8211;": "\u2013",
    "&#8212;": "\u2014",
    "&#8230;": "\u2026",
    "&#160;": " ",
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char);
  }
  // Decode numeric entities like &#123;
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  return result;
}

/**
 * Feed text as plain text, with the markup actually gone.
 *
 * This stripped tags and then decoded entities, in that order, which leaves
 * escaped markup intact as literal text. Plenty of publishers escape their
 * HTML, and some escape it twice: Cape Gazette's items arrive as
 * `&amp;lt;span class="field field-name-title"&amp;gt;`, so one pass of
 * strip-then-decode turned 5,200 characters of article into 135,000
 * characters of Drupal field markup — which measured as an unusually rich
 * feed and would have been handed to the model as the source text to report
 * from.
 *
 * Decoding first and repeating until the text stops changing handles both
 * depths. Three passes is enough for anything a feed has produced; the bound
 * is there so a pathological item cannot spin.
 */
function stripCDATA(text: string): string {
  let out = text.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "");

  for (let pass = 0; pass < 3; pass++) {
    const decoded = decodeHtmlEntities(out);
    // Script and style bodies are not markup — removing the tags leaves the
    // JavaScript behind as prose. Cape Gazette's feed carries its ad-slot
    // code inline, and `googletag.pubads().getSlots()` read as article text.
    const stripped = decoded
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    if (stripped === out) break;
    out = stripped;
  }

  return out.replace(/\s+/g, " ").trim();
}
