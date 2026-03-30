export interface FeedConfig {
  id: string;
  url: string | ((state: string, city?: string) => string);
  category: string;
  scope: "local" | "national" | "world";
  intervalHours: number;
  maxItems: number;
}

export const feeds: FeedConfig[] = [
  // LOCAL NEWS (per state) — every 2 hours
  {
    id: "google-news-local",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "local-news",
    scope: "local",
    intervalHours: 2,
    maxItems: 10,
  },
  {
    id: "google-news-local-city",
    url: (_state: string, city?: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent((city || "") + " news")}&hl=en-US&gl=US&ceid=US:en`,
    category: "local-news",
    scope: "local",
    intervalHours: 2,
    maxItems: 5,
  },

  // NATIONAL NEWS — every 3 hours
  {
    id: "google-news-us",
    url: "https://news.google.com/rss/search?q=United+States+news&hl=en-US&gl=US&ceid=US:en",
    category: "us-news",
    scope: "national",
    intervalHours: 3,
    maxItems: 10,
  },
  {
    id: "ap-news-top",
    url: "https://rsshub.app/apnews/topics/apf-topnews",
    category: "us-news",
    scope: "national",
    intervalHours: 3,
    maxItems: 8,
  },

  // POLITICS — every 4 hours
  {
    id: "google-news-politics",
    url: "https://news.google.com/rss/search?q=US+politics&hl=en-US&gl=US&ceid=US:en",
    category: "politics",
    scope: "national",
    intervalHours: 4,
    maxItems: 8,
  },
  {
    id: "google-news-politics-local",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " politics")}&hl=en-US&gl=US&ceid=US:en`,
    category: "politics",
    scope: "local",
    intervalHours: 4,
    maxItems: 5,
  },

  // SPORTS — every 4 hours
  {
    id: "google-news-sports",
    url: "https://news.google.com/rss/search?q=sports+news&hl=en-US&gl=US&ceid=US:en",
    category: "sports",
    scope: "national",
    intervalHours: 4,
    maxItems: 8,
  },
  {
    id: "google-news-sports-local",
    url: (state: string) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(state + " sports")}&hl=en-US&gl=US&ceid=US:en`,
    category: "sports",
    scope: "local",
    intervalHours: 5,
    maxItems: 5,
  },

  // ENTERTAINMENT / CELEBRITY — every 5 hours
  {
    id: "google-news-entertainment",
    url: "https://news.google.com/rss/search?q=entertainment+celebrity+news&hl=en-US&gl=US&ceid=US:en",
    category: "entertainment",
    scope: "national",
    intervalHours: 5,
    maxItems: 8,
  },
  {
    id: "google-news-celebrity",
    url: "https://news.google.com/rss/search?q=celebrity+gossip+scandal&hl=en-US&gl=US&ceid=US:en",
    category: "celebrity",
    scope: "national",
    intervalHours: 5,
    maxItems: 6,
  },

  // TECHNOLOGY — every 6 hours
  {
    id: "google-news-tech",
    url: "https://news.google.com/rss/search?q=technology+news&hl=en-US&gl=US&ceid=US:en",
    category: "technology",
    scope: "national",
    intervalHours: 6,
    maxItems: 8,
  },

  // WORLD NEWS — every 5 hours
  {
    id: "google-news-world",
    url: "https://news.google.com/rss/search?q=world+news&hl=en-US&gl=US&ceid=US:en",
    category: "world-news",
    scope: "world",
    intervalHours: 5,
    maxItems: 8,
  },
  {
    id: "guardian-world",
    url: "https://www.theguardian.com/world/rss",
    category: "world-news",
    scope: "world",
    intervalHours: 5,
    maxItems: 5,
  },

  // LIFESTYLE — every 7 hours
  {
    id: "google-news-lifestyle",
    url: "https://news.google.com/rss/search?q=lifestyle+health+wellness&hl=en-US&gl=US&ceid=US:en",
    category: "lifestyle",
    scope: "national",
    intervalHours: 7,
    maxItems: 6,
  },

  // CRIME / SCANDALS — every 5 hours
  {
    id: "google-news-crime",
    url: "https://news.google.com/rss/search?q=crime+scandal+news&hl=en-US&gl=US&ceid=US:en",
    category: "crime",
    scope: "national",
    intervalHours: 5,
    maxItems: 6,
  },

  // BUSINESS — every 6 hours
  {
    id: "google-news-business",
    url: "https://news.google.com/rss/search?q=business+economy+news&hl=en-US&gl=US&ceid=US:en",
    category: "business",
    scope: "national",
    intervalHours: 6,
    maxItems: 6,
  },

  // OPINION (seed topics for AI generation) — every 8 hours
  {
    id: "google-news-opinion-seed",
    url: "https://news.google.com/rss/search?q=editorial+opinion+debate&hl=en-US&gl=US&ceid=US:en",
    category: "opinion",
    scope: "national",
    intervalHours: 8,
    maxItems: 4,
  },
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
