import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import CategoryPageClient from "@/components/CategoryPageClient";

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
}: {
  params: { category: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const categoryLabel = params.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const url = `https://${site.domain}/${params.category}`;

  return {
    title: `${categoryLabel} News`,
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

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const site = getSiteFromHeaders();
  const categoryLabel = params.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

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
      />
    </>
  );
}
