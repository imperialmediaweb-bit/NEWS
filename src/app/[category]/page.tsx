import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { notFound } from "next/navigation";
import CategoryPageClient from "@/components/CategoryPageClient";
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
  searchParams: { page?: string };
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

  // A page number past the end has no content to show. Serving an empty 200
  // invites Google to index unlimited blank pages off ?page=999.
  if (page > 1 && articles.length === 0) {
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
      <CategoryPageClient
        site={site}
        categorySlug={params.category}
        categoryLabel={categoryLabel}
        articles={articles}
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
