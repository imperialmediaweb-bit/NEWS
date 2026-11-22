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
  Alabama: [{ url: "https://www.alabamaag.gov/feed/", publisher: "Alabama Attorney General", medianChars: 0 }],
  "New Mexico": [{ url: "https://www.dps.nm.gov/feed/", publisher: "New Mexico Department of Public Safety", medianChars: 0 }],
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
  Illinois: [{ url: "https://www.illinoisattorneygeneral.gov/", publisher: "Illinois Attorney General" }],
  Minnesota: [{ url: "https://dot.mn.gov/news", publisher: "Minnesota Department of Transportation" }],
  Missouri: [{ url: "https://governor.mo.gov/press-releases", publisher: "Office of the Missouri Governor" }],
  "New York": [{ url: "https://governor.ny.gov/news", publisher: "Office of the New York Governor" }],
  "North Carolina": [{ url: "https://governor.nc.gov/news", publisher: "Office of the North Carolina Governor" }],
  "North Dakota": [{ url: "https://governor.nd.gov/news", publisher: "Office of the North Dakota Governor" }],
  "South Dakota": [{ url: "https://governor.sd.gov/", publisher: "Office of the South Dakota Governor" }],
  Washington: [{ url: "https://governor.wa.gov/news", publisher: "Office of the Washington Governor" }],
  "West Virginia": [{ url: "https://governor.wv.gov/news", publisher: "Office of the West Virginia Governor" }],
  Delaware: [{ url: "https://news.delaware.gov/", publisher: "State of Delaware" }],
  "Rhode Island": [
    { url: "https://governor.ri.gov/press-releases", publisher: "Office of the Rhode Island Governor" },
    { url: "https://www.providenceri.gov/news/", publisher: "City of Providence" },
  ],
};
