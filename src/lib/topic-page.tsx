import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import type { SiteConfig } from "@/config/site-config";
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

/**
 * Shared by the county, city and team pages: every story that names the
 * subject, in the site's own section design. A subject with fewer than three
 * stories stays out of the index until it has some.
 */
export function siteFromHeaders(): SiteConfig {
  try {
    const h = headers();
    return getSiteByDomain(h.get("host") || h.get("x-forwarded-host") || "") || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

export const slugOf = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function topicMetadata(site: SiteConfig, term: string, path: string, title: string, description: string): Promise<Metadata> {
  const { total } = await getTagArticles(site.slug, term, 1);
  const url = `https://${site.domain}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(total < 3 ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "website", title: `${title} | ${site.name}`, url, siteName: site.name },
  };
}

export async function TopicPage({ site, term, label, path, crumb, section, pageParam, design }: {
  site: SiteConfig;
  term: string;
  label: string;
  path: string;
  crumb: [string, string];
  section: string;
  pageParam?: string;
  design?: string;
}) {
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const { articles, total, totalPages } = await getTagArticles(site.slug, term, page);
  if (page > 1 && articles.length === 0) notFound();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${site.domain}` },
      { "@type": "ListItem", position: 2, name: crumb[0], item: `https://${site.domain}${crumb[1]}` },
      { "@type": "ListItem", position: 3, name: label, item: `https://${site.domain}${path}` },
    ],
  };
  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />;
  const fam = designState(site.slug, design).family;
  if (fam && articles.length > 0) {
    const [home, weather] = await Promise.all([getHomepageArticles(site), getStateWeather(site.state)]);
    const View = { peach: CategoryPeach, tabloid: CategoryTabloid, magazine: CategoryMagazine, broadsheet: CategoryBroadsheet, coastal: CategoryCoastal, dark: CategoryDark, western: CategoryWestern, gazette: CategoryGazette, live: CategoryLive }[fam];
    return (
      <>
        {ld}
        <View site={site} slug={section} label={label} stories={articles.map((a) => ({ ...a }))} latestState={home?.pool || []} capital={weather[0]} counties={countiesOf(site.state)} page={page} totalPages={totalPages} basePath={path} />
      </>
    );
  }
  return (
    <>
      {ld}
      <TagPageClient site={site} tag={slugOf(term)} tagLabel={`${label} News`} articles={articles} total={total} page={page} totalPages={totalPages} basePath={path} />
    </>
  );
}
