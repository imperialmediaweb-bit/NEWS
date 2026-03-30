import { XMLParser } from "fast-xml-parser";

export interface FeedItem {
  guid: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function parseFeed(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MediaChief/1.0)",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status} ${res.statusText} for ${url}`);
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
    guid: String(item.guid || item.link || ""),
    title: stripCDATA(String(item.title || "")),
    link: String(item.link || ""),
    description: stripCDATA(String(item.description || "")),
    pubDate: String(item.pubDate || ""),
    source: String(
      typeof item.source === "object" && item.source !== null
        ? (item.source as Record<string, string>)["#text"] || ""
        : item.source || ""
    ),
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
      description: stripCDATA(String(e.summary || e.content || "")),
      pubDate: String(e.updated || e.published || ""),
      source: "",
    };
  });
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

function stripCDATA(text: string): string {
  return decodeHtmlEntities(
    text
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .trim()
  );
}
