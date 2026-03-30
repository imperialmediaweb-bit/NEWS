export interface FeedConfig {
  id: string;
  url: (state: string, city?: string) => string;
  category: string;
  intervalHours: number;
  maxItems: number;
}

// Helper: Google News RSS with "when:Xh" for recent articles only
function gNews(query: string, whenHours?: number): string {
  const when = whenHours ? `+when:${whenHours}h` : "";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query + when)}&hl=en-US&gl=US&ceid=US:en`;
}

// All feeds are local per state — unique content per site, no duplicate content
// Articles are filtered to recent hours using Google News "when:" operator
export const feeds: FeedConfig[] = [
  // LOCAL NEWS — every 1h, only last 2h articles
  {
    id: "google-news-local",
    url: (state: string) => gNews(`${state} news`, 2),
    category: "local-news",
    intervalHours: 1,
    maxItems: 3,
  },
  {
    id: "google-news-local-city",
    url: (_state: string, city?: string) => gNews(`${city || ""} news`, 2),
    category: "local-news",
    intervalHours: 1,
    maxItems: 2,
  },

  // POLITICS — every 2h, only last 3h articles
  {
    id: "google-news-politics",
    url: (state: string) => gNews(`${state} politics`, 3),
    category: "politics",
    intervalHours: 2,
    maxItems: 2,
  },

  // CRIME — every 2h, only last 3h articles
  {
    id: "google-news-crime",
    url: (state: string) => gNews(`${state} crime`, 3),
    category: "crime",
    intervalHours: 2,
    maxItems: 2,
  },

  // SPORTS — every 2h, only last 3h articles
  {
    id: "google-news-sports",
    url: (state: string) => gNews(`${state} sports`, 3),
    category: "sports",
    intervalHours: 2,
    maxItems: 2,
  },

  // US / NATIONAL NEWS — every 3h, only last 4h articles
  {
    id: "google-news-us",
    url: (state: string) => gNews(`${state} national news`, 4),
    category: "us-news",
    intervalHours: 3,
    maxItems: 2,
  },

  // WORLD NEWS — every 6h, only last 8h articles
  {
    id: "google-news-world",
    url: (state: string) => gNews(`${state} world news`, 8),
    category: "world-news",
    intervalHours: 6,
    maxItems: 2,
  },

  // ENTERTAINMENT — every 12h, only last 24h articles
  {
    id: "google-news-entertainment",
    url: (state: string) => gNews(`${state} entertainment`, 24),
    category: "entertainment",
    intervalHours: 12,
    maxItems: 2,
  },

  // CELEBRITY — every 12h, only last 24h articles
  {
    id: "google-news-celebrity",
    url: (state: string) => gNews(`${state} celebrity gossip`, 24),
    category: "celebrity",
    intervalHours: 12,
    maxItems: 2,
  },

  // BUSINESS — every 12h, only last 24h articles
  {
    id: "google-news-business",
    url: (state: string) => gNews(`${state} business economy`, 24),
    category: "business",
    intervalHours: 12,
    maxItems: 2,
  },

  // TECHNOLOGY — every 12h, only last 24h articles
  {
    id: "google-news-tech",
    url: (state: string) => gNews(`${state} technology`, 24),
    category: "technology",
    intervalHours: 12,
    maxItems: 2,
  },

  // LIFESTYLE — every 12h, only last 24h articles
  {
    id: "google-news-lifestyle",
    url: (state: string) => gNews(`${state} lifestyle health`, 24),
    category: "lifestyle",
    intervalHours: 12,
    maxItems: 2,
  },

  // OPINION (seed topics) — every 12h
  {
    id: "google-news-opinion-seed",
    url: (state: string) => gNews(`${state} editorial opinion`, 24),
    category: "opinion",
    intervalHours: 12,
    maxItems: 1,
  },
];

// 50 states split into 5 batches of 10 for cron scheduling
export const STATE_BATCHES: string[][] = [
  ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia"],
  ["Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland"],
  ["Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey"],
  ["New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina"],
  ["South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
];

// Publishing hours: 6 AM - 10 PM Eastern Time (UTC-5 / UTC-4 DST)
export const PUBLISH_START_HOUR_UTC = 10; // 6 AM ET = 10:00 UTC (EST) / 11:00 UTC (EDT)
export const PUBLISH_END_HOUR_UTC = 3;    // 10 PM ET = 03:00 UTC next day

/**
 * Check if current time is within publishing hours (6 AM - 10 PM ET).
 * Returns true if pipeline should be active.
 */
export function isPublishingHours(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Publishing window in UTC: 10:00 - 03:00 next day (wraps midnight)
  // This covers 6 AM - 10 PM ET (EST, roughly — DST shifts by 1h which is fine)
  if (PUBLISH_START_HOUR_UTC < PUBLISH_END_HOUR_UTC) {
    return utcHour >= PUBLISH_START_HOUR_UTC && utcHour < PUBLISH_END_HOUR_UTC;
  }
  // Wraps past midnight UTC
  return utcHour >= PUBLISH_START_HOUR_UTC || utcHour < PUBLISH_END_HOUR_UTC;
}

// Categories that map to URL slugs
export const CATEGORY_MAP: Record<string, string> = {
  "local-news": "local-news",
  "us-news": "us-news",
  politics: "politics",
  sports: "sports",
  entertainment: "entertainment",
  celebrity: "celebrity",
  technology: "technology",
  "world-news": "world",
  lifestyle: "lifestyle",
  crime: "crime",
  business: "business",
  opinion: "opinion",
};

// Forbidden opinion topics — AI should never generate opinion articles about these
export const FORBIDDEN_OPINION_TOPICS = [
  "race",
  "racism",
  "racial",
  "ethnicity",
  "religion",
  "religious",
  "islam",
  "muslim",
  "christian",
  "jewish",
  "hindu",
  "abortion",
  "pro-life",
  "pro-choice",
  "transgender",
  "lgbtq",
  "gender identity",
  "sexual orientation",
  "suicide",
  "self-harm",
  "school shooting",
  "mass shooting",
  "child abuse",
  "sexual assault",
  "rape",
  "holocaust",
  "genocide",
  "slavery",
  "nazi",
  "terrorism",
  "terrorist",
];
