import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import pool from "@/lib/db";
import Link from "next/link";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host =
      headersList.get("host") || headersList.get("x-forwarded-host") || "";
    return getSiteByDomain(host) || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

function formatCategory(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "local-news":
    "Complete coverage of local news, city council decisions, community events, and neighborhood updates.",
  politics:
    "Political news, election coverage, government policy updates, and legislative analysis.",
  crime:
    "Crime reports, court proceedings, public safety alerts, and law enforcement news.",
  sports:
    "Sports scores, game recaps, athlete profiles, high school and college athletics coverage.",
  entertainment:
    "Entertainment news, movie reviews, music updates, TV shows, and pop culture coverage.",
  celebrity:
    "Celebrity news, Hollywood gossip, red carpet events, and entertainment industry updates.",
  technology:
    "Tech news, product reviews, startup coverage, cybersecurity updates, and digital trends.",
  business:
    "Business news, economic reports, market analysis, corporate updates, and financial coverage.",
  lifestyle:
    "Lifestyle features, health tips, food and dining, travel guides, and wellness coverage.",
  "world-news":
    "International news, global politics, world events, and foreign affairs coverage.",
  "us-news":
    "National news from across the United States, federal government updates, and nationwide trends.",
  opinion:
    "Opinion columns, editorial commentary, letters to the editor, and expert analysis.",
};

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const label = formatCategory(params.category);
  const desc =
    CATEGORY_DESCRIPTIONS[params.category] ||
    `All ${label} articles and coverage.`;

  return {
    title: `${label} Hub — All ${label} Coverage | ${site.name}`,
    description: `${label} news hub for ${site.city}, ${site.state}. ${desc} Read the latest from ${site.name}.`,
    openGraph: {
      type: "website",
      title: `${label} Hub | ${site.name}`,
      description: `Complete ${label.toLowerCase()} coverage for ${site.city}, ${site.state}.`,
      siteName: site.name,
    },
    alternates: {
      canonical: `https://${site.domain}/hub/${params.category}`,
    },
  };
}

export default async function HubPage({
  params,
}: {
  params: { category: string };
}) {
  const site = getSiteFromHeaders();
  const label = formatCategory(params.category);
  const desc =
    CATEGORY_DESCRIPTIONS[params.category] ||
    `All ${label} articles from ${site.name}.`;

  // Get site ID
  const { rows: siteRows } = await pool.query(
    "SELECT id FROM sites WHERE slug = $1",
    [site.slug]
  );
  const siteId = siteRows.length > 0 ? siteRows[0].id : null;

  // Fetch all articles in this category (paginated, up to 100)
  const { rows: articles } = await pool.query(
    `SELECT title, slug, category, summary, featured_image, published_at, author
     FROM articles
     WHERE site_id = $1 AND category = $2
     ORDER BY published_at DESC
     LIMIT 100`,
    [siteId, params.category]
  );

  // Get total count
  const { rows: countRows } = await pool.query(
    "SELECT COUNT(*)::int as total FROM articles WHERE site_id = $1 AND category = $2",
    [siteId, params.category]
  );
  const totalArticles = countRows[0]?.total || 0;

  // Get related categories (other categories that have articles)
  const { rows: relatedCats } = await pool.query(
    `SELECT category, COUNT(*)::int as cnt
     FROM articles WHERE site_id = $1 AND category != $2
     GROUP BY category ORDER BY cnt DESC LIMIT 8`,
    [siteId, params.category]
  );

  // Get top authors in this category
  const { rows: topAuthors } = await pool.query(
    `SELECT author, COUNT(*)::int as cnt
     FROM articles WHERE site_id = $1 AND category = $2
     GROUP BY author ORDER BY cnt DESC LIMIT 5`,
    [siteId, params.category]
  );

  // Hub page schema — CollectionPage with itemList
  const hubJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} Hub — ${site.name}`,
    description: `${label} news coverage for ${site.city}, ${site.state}. ${desc}`,
    url: `https://${site.domain}/hub/${params.category}`,
    publisher: {
      "@type": "NewsMediaOrganization",
      name: site.name,
      url: `https://${site.domain}`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalArticles,
      itemListElement: articles.slice(0, 20).map(
        (a: Record<string, unknown>, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://${site.domain}/${a.category}/${a.slug}`,
          name: a.title,
        })
      ),
    },
    about: {
      "@type": "Place",
      name: `${site.city}, ${site.state}`,
    },
    inLanguage: "en-US",
  };

  // Breadcrumb schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${site.domain}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${label} Hub`,
        item: `https://${site.domain}/hub/${params.category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-[#f5f5f5]">
        {/* Hub Header */}
        <div className="bg-black text-white">
          <div className="max-w-[1300px] mx-auto px-4 py-10 md:py-16">
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#c1121f]">{label} Hub</span>
            </nav>
            <h1
              className="text-3xl md:text-5xl mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
              }}
            >
              {label} News Hub
            </h1>
            <p className="text-gray-400 max-w-2xl">{desc}</p>
            <p className="text-gray-500 text-sm mt-3">
              {totalArticles} articles &bull; {site.city}, {site.state}
            </p>
          </div>
        </div>

        <div className="max-w-[1300px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main: Articles */}
            <div className="lg:col-span-8">
              {/* Featured (first 3) */}
              {articles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {articles.slice(0, 3).map((a: Record<string, unknown>, i: number) => (
                    <Link
                      key={i}
                      href={`/${a.category}/${a.slug}`}
                      className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {(a.featured_image as string) && (
                        <div className="relative h-[200px] overflow-hidden">
                          <img
                            src={a.featured_image as string}
                            alt={a.title as string}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h2
                          className="font-bold text-sm leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mb-2"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 900,
                          }}
                        >
                          {a.title as string}
                        </h2>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {a.summary as string}
                        </p>
                        <p className="text-xs text-gray-400">
                          {a.author as string} &bull;{" "}
                          {new Date(
                            a.published_at as string
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* All articles list */}
              <h2
                className="text-xl font-bold mb-4 pb-2 border-b-2 border-[#c1121f]"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                }}
              >
                All {label} Articles
              </h2>
              <div className="space-y-3">
                {articles.slice(3).map((a: Record<string, unknown>, i: number) => (
                  <Link
                    key={i}
                    href={`/${a.category}/${a.slug}`}
                    className="group flex gap-4 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    {(a.featured_image as string) ? (
                      <img
                        src={a.featured_image as string}
                        alt={a.title as string}
                        className="w-24 h-24 object-cover rounded flex-shrink-0"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm group-hover:text-[#c1121f] transition-colors line-clamp-2">
                        {a.title as string}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {a.summary as string}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {a.author as string} &bull;{" "}
                        {new Date(
                          a.published_at as string
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
                {articles.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No articles yet in this category.
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-8 space-y-6">
                {/* Top Authors */}
                {topAuthors.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3
                      className="text-lg mb-4 pb-3 border-b-2 border-[#c1121f]"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 900,
                      }}
                    >
                      {label} Reporters
                    </h3>
                    <div className="space-y-3">
                      {topAuthors.map(
                        (
                          a: Record<string, unknown>,
                          i: number
                        ) => {
                          const name = (a.author as string)
                            .split(",")[0]
                            .trim();
                          const title =
                            (a.author as string)
                              .split(",")[1]
                              ?.trim() || "Reporter";
                          const slug = name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, "");
                          return (
                            <Link
                              key={i}
                              href={`/author/${slug}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="w-10 h-10 bg-[#c1121f] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="text-sm font-bold">
                                  {name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {title} &bull;{" "}
                                  {a.cnt as number} articles
                                </p>
                              </div>
                            </Link>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Related Topic Hubs */}
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <h3
                    className="text-lg mb-4 pb-3 border-b-2 border-[#c1121f]"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 900,
                    }}
                  >
                    More News Hubs
                  </h3>
                  <div className="space-y-2">
                    {relatedCats.map(
                      (c: Record<string, unknown>, i: number) => (
                        <Link
                          key={i}
                          href={`/hub/${c.category}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          <span className="font-medium">
                            {formatCategory(c.category as string)}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {c.cnt as number} articles
                          </span>
                        </Link>
                      )
                    )}
                  </div>
                </div>

                {/* SEO Pages Link */}
                <div className="bg-black text-white rounded-xl p-5">
                  <h3
                    className="text-lg mb-3"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 900,
                    }}
                  >
                    {site.state} Coverage
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Explore specialized coverage for {site.city},{" "}
                    {site.state} across all topics.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/${params.category}`}
                      className="px-3 py-1 text-xs bg-[#c1121f] rounded hover:bg-[#9b111e] transition-colors"
                    >
                      Latest {label}
                    </Link>
                    <Link
                      href="/"
                      className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                    >
                      Homepage
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
