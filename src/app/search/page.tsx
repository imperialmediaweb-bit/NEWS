import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";
import { searchArticles, SEARCH_PAGE_SIZE } from "@/lib/search";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    return getSiteByDomain(host) || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Metadata {
  const site = getSiteFromHeaders();
  const q = (searchParams.q || "").trim();

  return {
    title: q ? `Search results for "${q}"` : "Search",
    description: q
      ? `Articles matching "${q}" on ${site.name}.`
      : `Search news and archives from ${site.name}, covering ${site.state}.`,
    // Search result pages are thin and near-duplicate; keeping them out of the
    // index protects the site-quality review that AdSense runs.
    robots: { index: false, follow: true },
    alternates: { canonical: `https://${site.domain}/search` },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const site = getSiteFromHeaders();
  const content = generateContent(site);
  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const result = q ? await searchArticles(site, q, page) : null;
  const totalPages = result ? Math.ceil(result.total / SEARCH_PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-10">
          <h1
            className="text-3xl md:text-4xl mb-5"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
          >
            Search {site.name}
          </h1>

          {/* A plain GET form: works without JavaScript and keeps the query in
              the URL, so results are shareable and back/forward behave. */}
          <form action="/search" method="get" className="flex gap-2 max-w-2xl">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={`Search ${site.state} news…`}
              aria-label="Search articles"
              className="flex-1 px-4 py-3 rounded text-black text-base outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] transition-colors px-6 py-3 rounded font-bold uppercase tracking-wider text-sm"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Search
            </button>
          </form>

          {result && (
            <p className="text-gray-400 mt-4 text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {result.total === 0
                ? `No results for “${q}”`
                : `${result.total.toLocaleString()} result${result.total === 1 ? "" : "s"} for “${q}”`}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-8">
        {!q && (
          <p className="text-gray-600 text-base py-10">
            Enter a keyword above to search {site.name}&apos;s archive.
          </p>
        )}

        {result && result.total === 0 && (
          <div className="py-10">
            <p className="text-gray-700 text-base mb-4">
              We couldn&apos;t find any articles matching that search.
            </p>
            <p className="text-gray-500 text-sm">
              Try fewer or more general words, or browse{" "}
              <Link href="/local-news" className="text-[var(--accent)] font-semibold hover:underline">
                the latest {site.state} stories
              </Link>
              .
            </p>
          </div>
        )}

        {result && result.hits.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.hits.map((hit) => (
                <article
                  key={hit.slug}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <Link href={`/${hit.category}/${hit.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={hit.img}
                      alt=""
                      loading="lazy"
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-4">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]"
                        style={{ fontFamily: "'Oswald', sans-serif" }}
                      >
                        {hit.category.replace(/-/g, " ")}
                      </span>
                      <h2
                        className="text-base font-bold leading-snug mt-1 mb-2 line-clamp-3"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {hit.title}
                      </h2>
                      {hit.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hit.summary}</p>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {hit.author} · {hit.date}
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3 mt-10" aria-label="Search pagination">
                {page > 1 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded text-sm font-semibold hover:border-[var(--accent)] transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages.toLocaleString()}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded text-sm font-semibold hover:border-[var(--accent)] transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
