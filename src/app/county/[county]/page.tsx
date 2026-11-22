import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import TagPageClient from "@/components/TagPageClient";
import { getTagArticles } from "@/lib/category-data";
import { countiesOf, getStateWeather } from "@/lib/local-data";
import { designState } from "@/lib/design-nou";
import { getHomepageArticles } from "@/lib/homepage-data";
import CategoryLive from "@/components/design/live/CategoryLive";
import CategoryPeach from "@/components/design/peach/CategoryPeach";
import CategoryTabloid from "@/components/design/tabloid/CategoryTabloid";
import CategoryMagazine from "@/components/design/magazine/CategoryMagazine";
import CategoryBroadsheet from "@/components/design/broadsheet/CategoryBroadsheet";
import CategoryCoastal from "@/components/design/coastal/CategoryCoastal";
import CategoryDark from "@/components/design/dark/CategoryDark";
import CategoryWestern from "@/components/design/western/CategoryWestern";
import CategoryGazette from "@/components/design/gazette/CategoryGazette";

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

export default async function CountyPage({ params, searchParams }: { params: { county: string }; searchParams: { page?: string; design?: string } }) {
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
  // the site's own design, like its section pages; the plain list only as a fallback
  const design = designState(site.slug, searchParams.design);
  if (design.family && articles.length > 0) {
    const [home, weather] = await Promise.all([getHomepageArticles(site), getStateWeather(site.state)]);
    const View = { peach: CategoryPeach, tabloid: CategoryTabloid, magazine: CategoryMagazine, broadsheet: CategoryBroadsheet, coastal: CategoryCoastal, dark: CategoryDark, western: CategoryWestern, gazette: CategoryGazette, live: CategoryLive }[design.family];
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <View site={site} slug="local-news" label={label} stories={articles.map((a) => ({ ...a }))} latestState={home?.pool || []} capital={weather[0]} counties={countiesOf(site.state)} page={page} totalPages={totalPages} basePath={`/county/${params.county}`} />
      </>
    );
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <TagPageClient site={site} tag={params.county} tagLabel={`${label} News`} articles={articles} total={total} page={page} totalPages={totalPages} basePath={`/county/${params.county}`} />
    </>
  );
}
