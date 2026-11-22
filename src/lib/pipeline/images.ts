import { searchOpenverse, REAL_PHOTO_SUBJECT } from "./free-images";
import { PLACES } from "./relevance";
import { TEAMS } from "./google-news";
import { STATE_FACTS } from "@/config/state-data";
import allCounties from "@/config/counties/us-counties.json";

interface ImageResult {
  url: string;
  alt: string;
  credit: string;
}

const imageCache = new Map<string, ImageResult | null>();

async function searchPixabay(query: string): Promise<ImageResult | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;

  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=1200&per_page=5&safesearch=true`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const hit = data.hits?.[0];
  if (!hit) return null;

  return {
    url: hit.webformatURL || hit.largeImageURL,
    alt: query,
    credit: `Photo by ${hit.user} on Pixabay`,
  };
}

async function searchPexels(query: string): Promise<ImageResult | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=5`;
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) return null;

  return {
    url: photo.src.large || photo.src.medium || photo.src.original,
    alt: query,
    credit: `Photo by ${photo.photographer} on Pexels`,
  };
}

async function searchUnsplash(query: string): Promise<ImageResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;

  return {
    url: photo.urls.small || photo.urls.regular,
    alt: photo.alt_description || query,
    credit: `Photo by ${photo.user.name} on Unsplash`,
  };
}

type ImageProvider = (query: string) => Promise<ImageResult | null>;

// Pexels & Unsplash allow hotlinking, Pixabay as fallback only
const providers: ImageProvider[] = [searchPexels, searchUnsplash, searchPixabay];

/**
 * Try a single query across all 3 providers.
 */
async function tryQuery(query: string): Promise<ImageResult | null> {
  for (const provider of providers) {
    try {
      const result = await provider(query);
      if (result) return result;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Generate progressively simpler queries from the original.
 * Example: "Rhode Island courthouse fire investigation" →
 *   1. "Rhode Island courthouse fire investigation"
 *   2. "courthouse fire investigation"
 *   3. "courthouse fire"
 *   4. category fallback
 */
function buildQueryCascade(query: string, category?: string): string[] {
  const queries: string[] = [query];

  const words = query.split(/\s+/);

  // Remove state names if present (first 1-2 words often are)
  if (words.length > 3) {
    // Try without first word (often state name)
    queries.push(words.slice(1).join(" "));
  }

  // Try just the core (last 2-3 words)
  if (words.length > 3) {
    queries.push(words.slice(-3).join(" "));
  }
  if (words.length > 2) {
    queries.push(words.slice(-2).join(" "));
  }

  // Category-specific fallback images that always return results
  if (category) {
    const categoryFallbacks: Record<string, string> = {
      "local-news": "city skyline newspaper",
      "us-news": "american flag capitol",
      politics: "capitol building government",
      sports: "stadium sports arena",
      entertainment: "movie theater entertainment",
      celebrity: "red carpet celebrity",
      technology: "technology computer modern",
      "world-news": "globe world map",
      lifestyle: "healthy lifestyle wellness",
      crime: "police law enforcement",
      business: "business office finance",
      opinion: "newspaper editorial desk",
    };
    const fallback = categoryFallbacks[category];
    if (fallback && !queries.includes(fallback)) {
      queries.push(fallback);
    }
  }

  // Ultimate fallback
  queries.push("breaking news newspaper");

  return queries;
}

/**
 * Search for an image using progressive query simplification.
 * 1. Try the exact suggested query across all providers
 * 2. If no results, simplify the query (remove state, reduce words)
 * 3. If still nothing, use a category-specific generic query
 * 4. Last resort: generic "news" image
 *
 * Always returns an image — never null.
 */
/** The state's team a headline names (the full name, or a nickname of three letters or more). */
function teamIn(title: string, state: string): string | null {
  const t = title.toLowerCase();
  const teams = (TEAMS[state] || STATE_FACTS[state]?.teams || []).filter((x) => x.length >= 4).sort((a, b) => b.length - a.length);
  for (const team of teams) {
    const esc = team.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${esc}\\b`).test(t)) return team;
  }
  return null;
}

/** The town or county of the state a headline names, longest names first. */
function placeOf(title: string, state: string): string | null {
  const t = title.toLowerCase();
  const counties = ((allCounties as Record<string, string[]>)[state] || []).map((c) => `${c} ${state === "Louisiana" ? "parish" : "county"}`.toLowerCase());
  const names = (PLACES[state] || []).concat(counties).sort((a, b) => b.length - a.length);
  for (const n of names) {
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${esc}\\b(?!\\s+(county|parish|christian|university|college|elementary|isd))`).test(t)) return n;
  }
  return null;
}

export async function findImage(
  query: string,
  category?: string,
  ctx?: { title?: string; state?: string }
): Promise<ImageResult | null> {
  if (!query && !category) return null;

  // 1. A real photo of the place the story is about (Wikimedia, Flickr CC)
  // 2. For storms, fires, quakes, launches and landmarks, a real photo of the subject
  // Both free-licence, with the credit printed under the article.
  if (ctx?.title && ctx.state) {
    const place = placeOf(ctx.title, ctx.state);
    if (place) {
      const real = await searchOpenverse(`${place} ${ctx.state}`, "wikimedia,flickr");
      if (real) return real;
    }
    // a team named in the headline: a free-licence photo of the team or its venue
    const team = teamIn(ctx.title, ctx.state);
    if (team) {
      const t = await searchOpenverse(team, "wikimedia,flickr");
      if (t) return t;
    }
    if (REAL_PHOTO_SUBJECT.test(`${ctx.title} ${query}`)) {
      const subject = await searchOpenverse(query);
      if (subject) return subject;
    }
  }

  // Check cache with category context
  const cacheKey = `${query}|${category || ""}`;
  const cached = imageCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const queries = buildQueryCascade(query || "news", category);

  for (const q of queries) {
    // Skip empty queries
    if (!q.trim()) continue;

    const result = await tryQuery(q.trim());
    if (result) {
      // Use original query as alt text, not the simplified one
      result.alt = query || category || "News image";
      imageCache.set(cacheKey, result);
      return result;
    }
  }

  imageCache.set(cacheKey, null);
  return null;
}

/**
 * Clear the image cache (call between batches if needed)
 */
export function clearImageCache(): void {
  imageCache.clear();
}
