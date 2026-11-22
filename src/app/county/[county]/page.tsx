import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import TagPageClient from "@/components/TagPageClient";
import { getTagArticles } from "@/lib/category-data";
import { countiesOf } from "@/lib/local-data";

export const dynamic = "force-dynamic";

/**
 * /county/{name}-county — every story that names one of the state's counties.
 * Only real counties of the site's state; a county with fewer than three
 * stories stays out of the index until it has some.
 */
function siteFromHeaders() {
  try {
    const h = headers();
    return getSiteByDomain(h.get("host") || h.get("x-forwarded-host") || "") || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

const unit = (state: string) => (state === "Louisiana" ? "Parish" : "County");
const slugOf = (name: string, state: string) => `${name} ${unit(state)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function countyFor(param: string, state: string): string | null {
  const name = countiesOf(state).find((c) => slugOf(c, state) === param);
  return name ? `${name} ${unit(state)}` : null;
}

export async function generateMetadata({ params }: { params: { county: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const label = countyFor(params.county, site.state);
  if (!label) return {};
  const { total } = await getTagArticles(site.slug, label, 1);
  const url = `https://${site.domain}/county/${params.county}`;
  return {
    title: `${label} News, ${site.state}`,
    description: `The latest news from ${label}, ${site.state}: local government, public safety, schools, weather and community stories from ${site.name}.`,
    alternates: { canonical: url },
    ...(total < 3 ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "website", title: `${label} News | ${site.name}`, url, siteName: site.name },
  };
}

export default async function CountyPage({ params, searchParams }: { params: { county: string }; searchParams: { page?: string } }) {
  const site = siteFromHeaders();
  const label = countyFor(params.county, site.state);
  if (!label) notFound();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const { articles, total, totalPages } = await getTagArticles(site.slug, label, page);
  if (page > 1 && articles.length === 0) notFound();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${site.domain}` },
      { "@type": "ListItem", position: 2, name: "Local", item: `https://${site.domain}/local-news` },
      { "@type": "ListItem", position: 3, name: label, item: `https://${site.domain}/county/${params.county}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <TagPageClient site={site} tag={params.county} tagLabel={`${label} News`} articles={articles} total={total} page={page} totalPages={totalPages} basePath={`/county/${params.county}`} />
    </>
  );
}
