import type { FeedItem } from "./rss-parser";
import { extractArticleText } from "./source-fetch";

/**
 * Press-release pages without RSS — state police, attorneys general,
 * governors, sheriffs, city halls — read the way the Romanian Expres network
 * reads its police and prefecture pages: take the listing, follow the newest
 * release links, keep only releases dated in the last few days, and hand the
 * pipeline the release's own text, date and photo.
 *
 * Official releases are issued to be republished; the story credits the
 * agency, and the release photo carries "Photo: {agency}".
 */

const UA = "Mozilla/5.0 (compatible; StateExpressNewsroom/1.0; +press releases)";
const MAX_AGE_HOURS = 72;

async function getHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(15000), redirect: "follow" });
    if (!res.ok || !/html/i.test(res.headers.get("content-type") || "")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const decode = (x: string) =>
  x.replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&nbsp;/g, " ").replace(/&ndash;|&mdash;/g, "-").replace(/\s+/g, " ").trim();

/** Release links on a listing page: those under the listing's own path first, else same-site links with headline-length text. */
export function releaseLinks(html: string, listingUrl: string): string[] {
  const origin = new URL(listingUrl).origin;
  const abs = (h: string) => {
    try {
      return new URL(h, listingUrl).toString().replace(/#.*$/, "");
    } catch {
      return "";
    }
  };
  const skip = /\/(tag|tags|category|categories|author|page\/\d+|feed|search|login|subscribe|contact|about|events?\/?$)|\.(pdf|jpe?g|png|gif|docx?|xlsx?|zip)$/i;
  const base = listingUrl.replace(/[?#].*$/, "").replace(/\/+$/, "") + "/";
  const under = new Set<string>();
  const titled = new Set<string>();
  for (const m of Array.from(html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,400}?)<\/a>/gi))) {
    const href = abs(m[1]);
    if (!href.startsWith(origin) || skip.test(href) || href === listingUrl) continue;
    const text = decode(m[2].replace(/<[^>]+>/g, " "));
    if (href.startsWith(base) && href.length > base.length + 6 && !/[?&]page=/i.test(href)) under.add(href);
    if (text.length >= 25 && text.length <= 220) titled.add(href);
  }
  const list = under.size >= 3 ? Array.from(under) : Array.from(titled);
  return list.slice(0, 25);
}

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

/** The release's date: metadata first, then a "November 20, 2026" or "11/20/2026" near the headline. */
export function releaseDate(html: string): Date | null {
  const meta =
    html.match(/(?:article:published_time|datePublished|dc\.date|pubdate)["']?\s*(?:content|:)\s*=?\s*["']([^"']{8,40})["']/i) ||
    html.match(/<time[^>]+datetime=["']([^"']{8,40})["']/i);
  if (meta) {
    const d = new Date(meta[1]);
    if (!isNaN(+d)) return d;
  }
  const h1 = Math.max(0, html.search(/<h1[\s>]/i));
  const near = html.slice(Math.max(0, h1 - 1500), h1 + 4000).replace(/<[^>]+>/g, " ");
  const long = near.match(new RegExp(`\\b(${MONTHS})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(20\\d\\d)\\b`, "i"));
  if (long) {
    const d = new Date(`${long[1]} ${long[2]}, ${long[3]}`);
    if (!isNaN(+d)) return d;
  }
  const num = near.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d\d)\b/);
  if (num) {
    const d = new Date(+num[3], +num[1] - 1, +num[2]);
    if (!isNaN(+d)) return d;
  }
  return null;
}

/** The release's headline: og:title, else the page <title> before its "| Site" suffix, else the longest h1/h2. */
function releaseTitle(html: string): string {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og && decode(og).length >= 15) return decode(og);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const first = t ? decode(t).split(/\s+[|\u2013\u2014-]\s+/)[0] : "";
  if (first.length >= 20) return first;
  const heads = Array.from(html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)).map((m) => decode(m[1].replace(/<[^>]+>/g, " ")));
  return heads.sort((a, b) => b.length - a.length)[0] || "";
}

/** The release body: the readability extract, else every real paragraph on the page. */
function releaseText(html: string): string {
  const main = extractArticleText(html);
  if (main.length >= 300) return main;
  const clean = html.replace(/<(script|style|nav|footer|aside)[\s\S]*?<\/\1>/gi, " ");
  const paras = Array.from(clean.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => decode(m[1].replace(/<[^>]+>/g, " ")))
    .filter((p) => p.length >= 40 && !(p.length < 300 && /cookie|javascript|copyright|all rights reserved|subscribe/i.test(p)));
  return paras.join("\n\n");
}

function releaseImage(html: string, pageUrl: string): string | null {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (!m) return null;
  let url: string;
  try {
    url = new URL(m[1], pageUrl).toString();
  } catch {
    return null;
  }
  // the agency's logo or seal, or a booking photo, is not a news photo
  if (/logo|seal|badge|favicon|default|placeholder|share|mugshot|booking/i.test(url)) return null;
  return url;
}

/** Releases from the last few days on one listing page, as feed items (newest first, at most `max`). */
export async function scrapePressListing(listingUrl: string, publisher: string, max = 6): Promise<FeedItem[]> {
  const html = await getHtml(listingUrl);
  if (!html) return [];
  const out: FeedItem[] = [];
  const now = Date.now();
  for (const link of releaseLinks(html, listingUrl).slice(0, max * 2)) {
    if (out.length >= max) break;
    const page = await getHtml(link);
    if (!page) continue;
    const date = releaseDate(page);
    // no date, or older than three days, or "in the future": not taken
    if (!date || now - +date > MAX_AGE_HOURS * 3600e3 || +date - now > 36 * 3600e3) continue;
    const title = releaseTitle(page);
    const text = releaseText(page);
    if (title.length < 15 || text.length < 300) continue;
    const img = releaseImage(page, link);
    out.push({
      guid: link,
      title,
      link,
      // the release photo travels with the text; the rewrite step picks it up
      description: `${img ? `<!--img:${img}-->` : ""}${text}`,
      pubDate: date.toISOString(),
      source: publisher,
    });
  }
  return out;
}
