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
    url: hit.largeImageURL || hit.webformatURL,
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
    url: photo.src.large2x || photo.src.large || photo.src.original,
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
    url: photo.urls.regular || photo.urls.full,
    alt: photo.alt_description || query,
    credit: `Photo by ${photo.user.name} on Unsplash`,
  };
}

/**
 * Search for an image using the suggested query.
 * Tries Pixabay → Pexels → Unsplash in order.
 * Returns null if no image found from any provider.
 */
export async function findImage(query: string): Promise<ImageResult | null> {
  if (!query) return null;

  // Check cache
  const cached = imageCache.get(query);
  if (cached !== undefined) return cached;

  const providers = [searchPixabay, searchPexels, searchUnsplash];

  for (const provider of providers) {
    try {
      const result = await provider(query);
      if (result) {
        imageCache.set(query, result);
        return result;
      }
    } catch {
      continue;
    }
  }

  imageCache.set(query, null);
  return null;
}

/**
 * Clear the image cache (call between batches if needed)
 */
export function clearImageCache(): void {
  imageCache.clear();
}
