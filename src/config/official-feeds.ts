import type { StateFeed } from "./state-feeds";

/**
 * Official sources per state: governors, state police, attorneys general and
 * city halls that publish their own press releases as RSS. First-hand news
 * nobody else has rewritten yet, the way the Romanian Expres network works
 * from police, prefecture and city-hall releases.
 *
 * Hand-kept (state-feeds.ts is generated). The rewrite step fetches each
 * release's full page, so a short RSS description is fine here. Every URL was
 * checked to answer with recent items before it was added.
 */
export const OFFICIAL_FEEDS: Record<string, StateFeed[]> = {
  Texas: [
    { url: "https://gov.texas.gov/news/rss", publisher: "Office of the Texas Governor", medianChars: 0 },
    { url: "https://www.dps.texas.gov/rss.xml", publisher: "Texas Department of Public Safety", medianChars: 0 },
  ],
  Montana: [
    { url: "https://dojmt.gov/feed/", publisher: "Montana Department of Justice", medianChars: 0 },
    { url: "https://www.ci.missoula.mt.us/RSSFeed.aspx?ModID=1", publisher: "City of Missoula", medianChars: 0 },
  ],
  Ohio: [
    { url: "https://www.clevelandohio.gov/rss.xml", publisher: "City of Cleveland", medianChars: 0 },
    { url: "https://www.daytonohio.gov/RSSFeed.aspx?ModID=1", publisher: "City of Dayton", medianChars: 0 },
  ],
};

/**
 * Press-release pages without RSS (read by lib/pipeline/press-pages.ts).
 * Each was checked to list releases from the last days before it was added.
 */
export const OFFICIAL_PAGES: Record<string, { url: string; publisher: string }[]> = {
  Ohio: [{ url: "https://ohioattorneygeneral.gov/Media/News-Releases", publisher: "Ohio Attorney General" }],
  Delaware: [{ url: "https://news.delaware.gov/", publisher: "State of Delaware" }],
  "Rhode Island": [
    { url: "https://governor.ri.gov/press-releases", publisher: "Office of the Rhode Island Governor" },
    { url: "https://www.providenceri.gov/news/", publisher: "City of Providence" },
  ],
};
