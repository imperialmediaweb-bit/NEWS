import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import TagPageClient from "@/components/TagPageClient";

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

export default function TagPage({
  params,
}: {
  params: { tag: string };
}) {
  const site = getSiteFromHeaders();
  const tagLabel = params.tag
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

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
      <TagPageClient site={site} tag={params.tag} tagLabel={tagLabel} />
    </>
  );
}
