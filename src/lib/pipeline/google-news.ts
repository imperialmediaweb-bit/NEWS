import type { FeedItem } from "./rss-parser";
import { PLACES } from "./relevance";
import { STATE_FACTS } from "@/config/state-data";
import allCounties from "@/config/counties/us-counties.json";

/**
 * Google News as an active source, the way the Romanian Expres network uses
 * it (reteau-expres: lib/fetch-article.ts `deschideStireGoogle`,
 * app/api/cron/stiri-judet).
 *
 * The US pipeline dropped Google News because its links could no longer be
 * resolved to the publisher, so only a headline and a sentence were known and
 * the rest got invented. They can be resolved: the article page carries a
 * signature, and the same `batchexecute` call the page makes in a browser
 * returns the publisher's URL. When that fails the story is skipped — no link
 * is better than a wrong one — and with the real URL the story goes through
 * the normal path: full text fetched from the publisher, too-thin sources
 * rejected, state filter, rewrite.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export function gnewsSearchUrl(query: string, when = "1d"): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${when}`)}&hl=en-US&gl=US&ceid=US:en`;
}

/** Main cities per state, for the local-news search. */
export const STATE_CITIES: Record<string, string[]> = {
  Alabama: ["Birmingham", "Montgomery", "Huntsville", "Mobile"],
  Alaska: ["Anchorage", "Fairbanks", "Juneau", "Wasilla"],
  Arizona: ["Phoenix", "Tucson", "Mesa", "Flagstaff"],
  Arkansas: ["Little Rock", "Fayetteville", "Fort Smith", "Jonesboro"],
  California: ["Los Angeles", "San Diego", "San Francisco", "San Jose", "Sacramento", "Fresno"],
  Colorado: ["Denver", "Colorado Springs", "Aurora", "Fort Collins"],
  Connecticut: ["Hartford", "New Haven", "Bridgeport", "Stamford"],
  Delaware: ["Wilmington", "Dover", "Rehoboth Beach", "Newark, Delaware"],
  Florida: ["Jacksonville", "Miami", "Tampa", "Orlando"],
  Georgia: ["Atlanta", "Savannah", "Augusta", "Macon"],
  Hawaii: ["Honolulu", "Hilo", "Maui", "Kauai"],
  Idaho: ["Boise", "Idaho Falls", "Coeur d'Alene", "Pocatello"],
  Illinois: ["Chicago", "Springfield, Illinois", "Peoria", "Rockford"],
  Indiana: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"],
  Iowa: ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City"],
  Kansas: ["Wichita", "Topeka", "Overland Park", "Lawrence, Kansas"],
  Kentucky: ["Louisville", "Lexington", "Bowling Green", "Frankfort"],
  Louisiana: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  Maine: ["Portland, Maine", "Bangor", "Augusta, Maine", "Lewiston"],
  Maryland: ["Baltimore", "Annapolis", "Frederick", "Rockville"],
  Massachusetts: ["Boston", "Worcester", "Springfield, Massachusetts", "Cambridge"],
  Michigan: ["Detroit", "Grand Rapids", "Lansing", "Ann Arbor"],
  Minnesota: ["Minneapolis", "St. Paul", "Duluth", "Rochester, Minnesota"],
  Mississippi: ["Jackson, Mississippi", "Gulfport", "Biloxi", "Hattiesburg"],
  Missouri: ["Kansas City", "St. Louis", "Springfield, Missouri", "Columbia, Missouri"],
  Montana: ["Billings", "Missoula", "Bozeman", "Helena"],
  Nebraska: ["Omaha", "Lincoln, Nebraska", "Grand Island", "Kearney"],
  Nevada: ["Las Vegas", "Reno", "Henderson", "Carson City"],
  "New Hampshire": ["Manchester, New Hampshire", "Nashua", "Concord, New Hampshire", "Portsmouth, New Hampshire"],
  "New Jersey": ["Newark", "Jersey City", "Trenton", "Atlantic City"],
  "New Mexico": ["Albuquerque", "Santa Fe", "Las Cruces", "Rio Rancho"],
  "New York": ["New York City", "Buffalo", "Rochester, New York", "Albany", "Syracuse"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Asheville"],
  "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot"],
  Ohio: ["Columbus", "Cleveland", "Cincinnati", "Toledo"],
  Oklahoma: ["Oklahoma City", "Tulsa", "Norman", "Edmond"],
  Oregon: ["Portland, Oregon", "Salem, Oregon", "Eugene", "Bend, Oregon"],
  Pennsylvania: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown"],
  "Rhode Island": ["Providence", "Warwick", "Cranston", "Newport, Rhode Island"],
  "South Carolina": ["Charleston, South Carolina", "Columbia, South Carolina", "Greenville, South Carolina", "Myrtle Beach"],
  "South Dakota": ["Sioux Falls", "Rapid City", "Pierre", "Aberdeen, South Dakota"],
  Tennessee: ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  Texas: ["Houston", "Dallas", "San Antonio", "Austin", "Fort Worth", "El Paso"],
  Utah: ["Salt Lake City", "Provo", "Ogden", "St. George"],
  Vermont: ["Burlington, Vermont", "Montpelier", "Rutland", "Brattleboro"],
  Virginia: ["Richmond", "Virginia Beach", "Norfolk", "Arlington, Virginia"],
  Washington: ["Seattle", "Spokane", "Tacoma", "Olympia"],
  "West Virginia": ["Charleston, West Virginia", "Morgantown", "Huntington, West Virginia", "Wheeling"],
  Wisconsin: ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  Wyoming: ["Cheyenne", "Casper", "Laramie", "Jackson Hole"],
};

/**
 * The searches run for a state, each tied to the section it feeds.
 *
 * Local first, the way the Romanian Expres network works county by county:
 * besides the big cities, every visit also searches a rotating group of the
 * state's smaller towns and of its counties, so over a day the whole state is
 * covered, not only its largest metro. `round` turns the rotation (the cron slot).
 * Local searches alternate with the sections so a busy town cannot fill the run.
 */
export function stateQueries(state: string, round = 0): Array<{ q: string; section: string }> {
  const big = STATE_CITIES[state] || [];
  const cities = big.map((c) => `"${c}"`).join(" OR ");
  const s = `"${state}"`;
  const title = (x: string) => x.replace(/\b\w/g, (c) => c.toUpperCase());
  const small = (PLACES[state] || []).map(title).filter((c) => !big.includes(c));
  // the largest counties first, then every other county in the state
  const top = STATE_FACTS[state]?.counties || [];
  const rest = ((allCounties as Record<string, string[]>)[state] || []).filter((c) => !top.includes(c));
  const counties = top.concat(rest).map((c) => (/(County|Parish|Borough|Census Area)$/.test(c) ? c : `${c} ${state === "Louisiana" ? "Parish" : "County"}`));
  const group = (list: string[], n: number, k: number) => {
    if (!list.length) return [];
    const start = (k * n) % list.length;
    return list.concat(list).slice(start, start + Math.min(n, list.length));
  };
  const orQ = (list: string[]) => list.map((x) => `"${x}"`).join(" OR ");
  const towns = group(small, 4, round);
  const shire = group(counties, 3, round);
  const out: Array<{ q: string; section: string }> = [
    { q: cities || s, section: "local-news" },
    { q: `${s} (legislature OR governor OR lawmakers OR election)`, section: "politics" },
  ];
  if (towns.length) out.push({ q: `(${orQ(towns)}) ${s}`, section: "local-news" });
  out.push({ q: `${s} (business OR jobs OR economy OR company)`, section: "business" });
  if (shire.length) out.push({ q: `(${orQ(shire)}) ${s}`, section: "local-news" });
  out.push({ q: `${s} (football OR basketball OR baseball OR "high school")`, section: "sports" });
  out.push({ q: `${s} (festival OR restaurant OR museum OR "things to do")`, section: "life" });
  return out;
}

// Aggregators, social networks and video carry no article text of their own.
const SKIP_HOSTS = /(^|\.)(msn\.com|yahoo\.com|aol\.com|newsbreak\.com|ground\.news|flipboard\.com|apple\.news|youtube\.com|facebook\.com|x\.com|twitter\.com|instagram\.com|tiktok\.com|reddit\.com|linkedin\.com|news\.google\.com)$/i;

export function skippableHost(url: string): boolean {
  try {
    return SKIP_HOSTS.test(new URL(url).hostname);
  } catch {
    return true;
  }
}

let pausedUntil = 0;
/** After a 429 or 403 from Google, stop asking for a while. */
export function googlePaused(): boolean {
  return Date.now() < pausedUntil;
}
function noteStatus(status: number) {
  if (status === 429 || status === 403) pausedUntil = Date.now() + 30 * 60 * 1000;
}

const isGoogleHost = (u: string) => /(^|\.)(google|gstatic|googleusercontent|googleapis|youtube)\.[a-z.]+/i.test(new URL(u).hostname);

/** The publisher's URL behind a Google News article link, or null. */
export async function resolveGoogleNews(rawUrl: string): Promise<string | null> {
  const idm = rawUrl.match(/news\.google\.com\/(?:rss\/)?articles\/([^?/]+)/i);
  if (!idm) return null;
  if (googlePaused()) return null;
  const id = idm[1];
  try {
    const page = await fetch(`https://news.google.com/rss/articles/${id}`, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    noteStatus(page.status);
    if (!page.ok) return null;
    const html = await page.text();
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
    const aid = html.match(/data-n-a-id="([^"]+)"/)?.[1] || id;
    if (!sg || !ts) return null;

    const req = JSON.stringify([[[
      "Fbv4je",
      JSON.stringify(["garturlreq", [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "US:en", null, 180, null, null, null, null, null, 0, null, null, [1608992183, 723341000]], "en-US", "US", 1, [2, 4, 8], 1, 1, null, 0, 0, null, 0], aid, Number(ts), sg]),
      null,
      "generic",
    ]]]);
    const r = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `f.req=${encodeURIComponent(req)}`,
      signal: AbortSignal.timeout(10000),
    });
    noteStatus(r.status);
    if (!r.ok) return null;
    const text = await r.text();
    for (const raw of text.match(/https?:\/\/[^\s"\\]+/g) || []) {
      const u = raw.replace(/\\+$/, "");
      try {
        if (isGoogleHost(u) || /\.(js|css|png|jpe?g|gif|svg|woff2?)(\?|$)/i.test(u) || u.length < 15) continue;
      } catch {
        continue;
      }
      return u;
    }
    return null;
  } catch {
    return null;
  }
}

/** Google News titles end in " - Publisher"; the publisher is kept apart. */
export function splitPublisher(item: FeedItem): { title: string; publisher: string } {
  const m = item.title.match(/^(.*)\s+-\s+([^-]{2,80})$/);
  return m ? { title: m[1].trim(), publisher: m[2].trim() } : { title: item.title, publisher: item.source || "" };
}

const trendCache = new Map<string, { at: number; terms: string[] }>();

/**
 * What people in the state are searching Google for today (Google Trends'
 * daily trending searches for the state), turned into news searches tied to
 * the state. Cached for an hour; an empty list if Trends does not answer.
 * The stories still go through the same relevance check and rewrite rules.
 */
export async function trendQueries(state: string, stateAbbr: string, n = 3): Promise<Array<{ q: string; section: string; max?: number }>> {
  const hit = trendCache.get(stateAbbr);
  let terms = hit && Date.now() - hit.at < 3600e3 ? hit.terms : null;
  if (!terms) {
    try {
      const res = await fetch(`https://trends.google.com/trending/rss?geo=US-${stateAbbr}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; StateExpressNewsroom/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      const xml = res.ok ? await res.text() : "";
      terms = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([^<]{3,80})<\/title>/g)).map((m) => m[1].trim());
    } catch {
      terms = [];
    }
    trendCache.set(stateAbbr, { at: Date.now(), terms });
  }
  return terms.slice(0, n).map((t) => ({ q: `"${t.replace(/"/g, "")}" "${state}"`, section: "local-news", max: 2 }));
}
