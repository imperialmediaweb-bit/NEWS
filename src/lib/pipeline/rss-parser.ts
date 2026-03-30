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

function stripCDATA(text: string): string {
  return text
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}
