export interface FeedConfig {
  id: string;
  url: (state: string, city?: string) => string;
  category: string;
  intervalHours: number;
  maxItems: number;
}

// All feeds are local per state — unique content per site, no duplicate content
export const feeds: FeedConfig[] = [
  // LOCAL NEWS — every 2 hours
  {
    id: "google-news-local",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "local-news",
    intervalHours: 2,
    maxItems: 5,
  },
  {
    id: "google-news-local-city",
    url: (_state: string, city?: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent((city || "") + " news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "local-news",
    intervalHours: 2,
    maxItems: 3,
  },

  // US / NATIONAL NEWS — every 3 hours
  {
    id: "google-news-us",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " national news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "us-news",
    intervalHours: 3,
    maxItems: 4,
  },

  // POLITICS — every 4 hours
  {
    id: "google-news-politics",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " politics")}&hl=en-US&gl=US&ceid=US:en`,
    category: "politics",
    intervalHours: 4,
    maxItems: 4,
  },

  // SPORTS — every 4 hours
  {
    id: "google-news-sports",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " sports")}&hl=en-US&gl=US&ceid=US:en`,
    category: "sports",
    intervalHours: 4,
    maxItems: 4,
  },

  // ENTERTAINMENT — every 5 hours
  {
    id: "google-news-entertainment",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " entertainment")}&hl=en-US&gl=US&ceid=US:en`,
    category: "entertainment",
    intervalHours: 5,
    maxItems: 3,
  },

  // CELEBRITY — every 6 hours
  {
    id: "google-news-celebrity",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " celebrity gossip")}&hl=en-US&gl=US&ceid=US:en`,
    category: "celebrity",
    intervalHours: 6,
    maxItems: 3,
  },

  // TECHNOLOGY — every 6 hours
  {
    id: "google-news-tech",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " technology")}&hl=en-US&gl=US&ceid=US:en`,
    category: "technology",
    intervalHours: 6,
    maxItems: 3,
  },

  // WORLD NEWS — every 5 hours
  {
    id: "google-news-world",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " world news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "world-news",
    intervalHours: 5,
    maxItems: 3,
  },

  // LIFESTYLE — every 7 hours
  {
    id: "google-news-lifestyle",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " lifestyle health")}&hl=en-US&gl=US&ceid=US:en`,
    category: "lifestyle",
    intervalHours: 7,
    maxItems: 3,
  },

  // CRIME — every 5 hours
  {
    id: "google-news-crime",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " crime")}&hl=en-US&gl=US&ceid=US:en`,
    category: "crime",
    intervalHours: 5,
    maxItems: 4,
  },

  // BUSINESS — every 6 hours
  {
    id: "google-news-business",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " business economy")}&hl=en-US&gl=US&ceid=US:en`,
    category: "business",
    intervalHours: 6,
    maxItems: 3,
  },

  // OPINION (seed topics for AI generation) — every 8 hours
  {
    id: "google-news-opinion-seed",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " editorial opinion")}&hl=en-US&gl=US&ceid=US:en`,
    category: "opinion",
    intervalHours: 8,
    maxItems: 2,
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
