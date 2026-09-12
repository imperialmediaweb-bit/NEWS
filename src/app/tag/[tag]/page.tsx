import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { notFound } from "next/navigation";
import TagPageClient from "@/components/TagPageClient";
import { getTagArticles } from "@/lib/category-data";

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
}: {
  params: { tag: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const tagLabel = params.tag
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const url = `https://${site.domain}/tag/${params.tag}`;

  return {
    title: `${tagLabel} News & Articles`,
    description: `Articles tagged with "${tagLabel}" on ${site.name}. Latest news from ${site.city}, ${site.state}.`,
    keywords: [tagLabel, site.city, site.state, site.name, "news"],
    openGraph: {
      type: "website",
      title: `${tagLabel} | ${site.name}`,
      description: `Articles tagged with "${tagLabel}" on ${site.name}.`,
      url,
      siteName: site.name,
    },
    twitter: {
      card: "summary",
      title: `${tagLabel} | ${site.name}`,
      description: `Articles tagged with "${tagLabel}" on ${site.name}.`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { tag: string };
  searchParams: { page?: string };
}) {
  const site = getSiteFromHeaders();
  const tagLabel = params.tag
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const page = parsePage(searchParams.page);

  const { articles, total, totalPages } = await getTagArticles(
    site.slug,
    params.tag,
    page
  );

  if (page > 1 && articles.length === 0) {
    notFound();
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${site.domain}` },
      { "@type": "ListItem", position: 2, name: "Tags", item: `https://${site.domain}/tag` },
      { "@type": "ListItem", position: 3, name: tagLabel, item: `https://${site.domain}/tag/${params.tag}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TagPageClient
        site={site}
        tag={params.tag}
        tagLabel={tagLabel}
        articles={articles}
        total={total}
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
