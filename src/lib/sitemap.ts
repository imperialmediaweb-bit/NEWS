/**
 * URLs per paginated article sitemap.
 *
 * The sitemap spec allows 50,000, but every URL has to be held in memory as a
 * string while the response is built, and at that size it was ~10MB per
 * crawler request. 5,000 keeps a page near a megabyte while still covering an
 * archive of any size across enough pages.
 *
 * Lives here rather than in the route because a Next.js route file may only
 * export its handlers and a fixed set of config values.
 */
export const SITEMAP_PAGE_SIZE = 5000;
