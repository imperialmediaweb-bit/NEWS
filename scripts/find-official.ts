/**
 * Find official press sources for every state: tries the usual hosts of the
 * governor, attorney general, state police and state news portal with the
 * usual news paths, and keeps what really lists releases from the last days
 * (an RSS feed if the page announces one, else the page itself).
 *
 *   npx tsx --tsconfig tsconfig.json scripts/find-official.ts > scripts/official-found.json
 */
import { sites } from "../src/config/sites";
import { scrapePressListing } from "../src/lib/pipeline/press-pages";
import { parseFeed } from "../src/lib/pipeline/rss-parser";

const PATHS = ["/news", "/newsroom", "/press-releases", "/news-releases", "/news/press-releases", "/media/press-releases", "/media", "/news-room", "/press", "/"];
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");

function hosts(state: string, ab: string): Array<[string, string]> {
  const st = ab.toLowerCase();
  const full = slugify(state);
  return [
    [`https://governor.${st}.gov`, `Office of the ${state} Governor`],
    [`https://gov.${st}.gov`, `Office of the ${state} Governor`],
    [`https://www.governor.${st}.gov`, `Office of the ${state} Governor`],
    [`https://ag.${st}.gov`, `${state} Attorney General`],
    [`https://www.${full}ag.gov`, `${state} Attorney General`],
    [`https://www.${full}attorneygeneral.gov`, `${state} Attorney General`],
    [`https://attorneygeneral.${st}.gov`, `${state} Attorney General`],
    [`https://news.${st}.gov`, `State of ${state}`],
    [`https://news.${full}.gov`, `State of ${state}`],
    [`https://dps.${st}.gov`, `${state} Department of Public Safety`],
    [`https://www.${st}sp.gov`, `${state} State Police`],
    [`https://statepolice.${st}.gov`, `${state} State Police`],
    [`https://dot.${st}.gov`, `${state} Department of Transportation`],
  ];
}

async function get(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

async function tryHost(base: string, publisher: string) {
  const home = await get(base + "/");
  if (!home) return null;
  // an RSS feed the site announces
  const rss = home.match(/<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (rss) {
    const feed = new URL(rss, base).toString();
    const items = await parseFeed(feed).catch(() => []);
    const fresh = items.filter((i) => i.pubDate && Date.now() - +new Date(i.pubDate) < 7 * 86400e3);
    if (fresh.length >= 2) return { kind: "rss", url: feed, publisher, recent: fresh.length };
  }
  for (const p of PATHS) {
    const url = base + p;
    const items = await scrapePressListing(url, publisher, 2).catch(() => []);
    if (items.length >= 1) return { kind: "page", url, publisher, recent: items.length, sample: items[0].title.slice(0, 80) };
  }
  return null;
}

(async () => {
  const states = Object.values(sites).filter((s) => !process.argv[2] || s.state === process.argv[2]);
  const out: Record<string, unknown[]> = {};
  await Promise.all(
    states.map(async (s) => {
      const found = [];
      const seen = new Set<string>();
      for (const [base, pub] of hosts(s.state, s.stateAbbr)) {
        const r = await tryHost(base, pub);
        if (r && !seen.has(r.publisher)) {
          seen.add(r.publisher);
          found.push(r);
        }
      }
      out[s.state] = found;
      process.stderr.write(`${s.state}: ${found.length}\n`);
    })
  );
  console.log(JSON.stringify(out, null, 2));
})();
