import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
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

function unslugify(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const authorName = unslugify(params.name);

  return {
    title: `${authorName} — Reporter at ${site.name}`,
    description: `Read articles by ${authorName} at ${site.name}. Latest news, analysis, and reporting from ${site.city}, ${site.state}.`,
    openGraph: {
      type: "profile",
      title: `${authorName} — ${site.name}`,
      description: `Articles by ${authorName} at ${site.name}`,
      siteName: site.name,
    },
    alternates: {
      canonical: `https://${site.domain}/author/${params.name}`,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: { name: string };
}) {
  const site = getSiteFromHeaders();
  const authorName = unslugify(params.name);

  // Get site ID
  const { rows: siteRows } = await pool.query(
    "SELECT id FROM sites WHERE slug = $1",
    [site.slug]
  );
  const siteId = siteRows.length > 0 ? siteRows[0].id : null;

  // Fetch articles by this author (match by name part before comma)
  const { rows: articles } = await pool.query(
    `SELECT title, slug, category, summary, featured_image, published_at, author
     FROM articles
     WHERE site_id = $1 AND LOWER(REPLACE(author, '''', '')) LIKE $2
     ORDER BY published_at DESC LIMIT 50`,
    [siteId, `${authorName.toLowerCase().replace(/'/g, "")}%`]
  );

  // Real 404 for unknown authors — never render a fabricated profile page
  // (soft-404 farm + E-E-A-T misrepresentation risk).
  if (articles.length === 0) {
    notFound();
  }

  // Extract title from first article's author field
  const authorFull = articles.length > 0 ? articles[0].author : authorName;
  const parts = authorFull.split(",");
  const displayName = parts[0]?.trim() || authorName;
  const displayTitle = parts[1]?.trim() || "Staff Reporter";

  // Person schema for Google
  // Minimal Person schema — no jobTitle/credentials claims for bylines.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `https://${site.domain}/author/${params.name}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Author Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {displayName
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-gray-500 text-lg">{displayTitle}</p>
              <p className="text-gray-400 text-sm mt-1">
                {site.name} — {site.city}, {site.state}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            {articles.length} article{articles.length !== 1 ? "s" : ""} published
          </p>
        </div>

        {/* Articles */}
        <h2 className="text-xl font-bold mb-4">
          Articles by {displayName}
        </h2>
        <div className="space-y-4">
          {articles.map((article: Record<string, unknown>, i: number) => (
            <Link
              key={i}
              href={`/${article.category}/${article.slug}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {(article.featured_image as string) ? (
                  <img
                    src={article.featured_image as string}
                    alt={article.title as string}
                    className="w-24 h-24 object-cover rounded"
                  />
                ) : null}
                <div className="flex-1">
                  <span className="text-xs font-medium text-[var(--accent)] uppercase">
                    {(article.category as string).replace(/-/g, " ")}
                  </span>
                  <h3 className="font-bold mt-1">{article.title as string}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {article.summary as string}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(article.published_at as string).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {articles.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No articles found for this author.
            </p>
          )}
        </div>
      </div>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
