import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { notFound } from "next/navigation";
import CategoryPageClient from "@/components/CategoryPageClient";
import { designState } from "@/lib/design-nou";
import { getHomepageArticles } from "@/lib/homepage-data";
import { getStateWeather, countiesOf } from "@/lib/local-data";
import CategoryLive from "@/components/design/live/CategoryLive";
import CategoryPeach from "@/components/design/peach/CategoryPeach";
import CategoryTabloid from "@/components/design/tabloid/CategoryTabloid";
import CategoryMagazine from "@/components/design/magazine/CategoryMagazine";
import CategoryBroadsheet from "@/components/design/broadsheet/CategoryBroadsheet";
import { TOPIC_RE } from "@/components/design/live/shared";
import { getCategoryArticles } from "@/lib/category-data";

export const dynamic = "force-dynamic";

function parsePage(value?: string): number {
  const n = parseInt(value || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    const detected = getSiteByDomain(host);
    return detected || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { page?: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const categoryLabel = params.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const page = parsePage(searchParams.page);
  // Each paginated page is its own canonical — pointing page 2+ back at page 1
  // tells Google the deeper pages are duplicates and it stops following them,
  // which is the opposite of what pagination is for.
  const url =
    page > 1
      ? `https://${site.domain}/${params.category}?page=${page}`
      : `https://${site.domain}/${params.category}`;

  return {
    title: page > 1 ? `${categoryLabel} News — Page ${page}` : `${categoryLabel} News`,
    description: `Latest ${categoryLabel.toLowerCase()} news from ${site.city}, ${site.state}. Breaking stories, analysis and more from ${site.name}.`,
    keywords: [categoryLabel, site.city, site.state, site.name, "news", "breaking news"],
    openGraph: {
      type: "website",
      title: `${categoryLabel} News | ${site.name}`,
      description: `Latest ${categoryLabel.toLowerCase()} news from ${site.city}, ${site.state}.`,
      url,
      siteName: site.name,
    },
    twitter: {
      card: "summary",
      title: `${categoryLabel} News | ${site.name}`,
      description: `Latest ${categoryLabel.toLowerCase()} news from ${site.city}, ${site.state}.`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { page?: string; design?: string | string[] };
}) {
  const site = getSiteFromHeaders();
  const categoryLabel = params.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const page = parsePage(searchParams.page);

  const { articles, totalPages } = await getCategoryArticles(
    site.slug,
    params.category,
    page
  );

  // Any single path segment lands here, so /nonsense.txt and /whatever-i-type
  // were answering 200 with an empty category page. That is a soft 404: it
  // invites Google to index unlimited blank pages, it wastes crawl budget on
  // a network already taking a million bot requests a day, and it broke
  // IndexNow, whose validator fetches https://<host>/<key>.txt and got HTML.
  // An empty category has nothing to show either way, so 404 it.
  // Per-site design (lib/design-nou.ts). A menu section with no tagged
  // stories yet is built from recent stories on its subject; anything else
  // with no stories is still a 404.
  const design = designState(site.slug, searchParams.design);
  let live: React.ReactNode = null;
  if (design.family) {
    const [home, weather] = await Promise.all([getHomepageArticles(site), getStateWeather(site.state)]);
    const pool = home?.pool || [];
    let stories = articles.map((a) => ({ ...a }));
    let pages = totalPages;
    if (stories.length === 0) {
      const re = TOPIC_RE[params.category];
      stories = params.category === "opinion" ? home?.opinion || [] : re ? pool.filter((a) => re.test(a.title)) : [];
      pages = 1;
    }
    if (stories.length > 0) {
      const CategoryView = { peach: CategoryPeach, tabloid: CategoryTabloid, magazine: CategoryMagazine, broadsheet: CategoryBroadsheet, live: CategoryLive }[design.family];
      live = (
        <CategoryView
          site={site}
          slug={params.category}
          label={categoryLabel}
          stories={stories}
          latestState={pool}
          capital={weather[0]}
          counties={countiesOf(site.state)}
          page={page}
          totalPages={pages}
        />
      );
    }
  }

  if (articles.length === 0 && !live) {
    notFound();
  }

  // JSON-LD: BreadcrumbList for category
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
        name: categoryLabel,
        item: `https://${site.domain}/${params.category}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {design.preview && <meta name="robots" content="noindex, nofollow" />}
      {live || (
      <CategoryPageClient
        site={site}
        categorySlug={params.category}
        categoryLabel={categoryLabel}
        articles={articles}
        page={page}
        totalPages={totalPages}
      />
      )}
    </>
  );
}
