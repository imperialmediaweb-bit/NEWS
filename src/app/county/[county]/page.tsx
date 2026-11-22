import { Metadata } from "next";
import { notFound } from "next/navigation";
import { countiesOf } from "@/lib/local-data";
import { siteFromHeaders, slugOf, topicMetadata, TopicPage } from "@/lib/topic-page";

export const dynamic = "force-dynamic";

/** /county/{name}-county — every story that names one of the state's counties (parishes in Louisiana). */
const unit = (state: string) => (state === "Louisiana" ? "Parish" : "County");
function countyFor(param: string, state: string): string | null {
  const name = countiesOf(state).find((c) => slugOf(`${c} ${unit(state)}`) === param);
  return name ? `${name} ${unit(state)}` : null;
}

export async function generateMetadata({ params }: { params: { county: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const label = countyFor(params.county, site.state);
  if (!label) return {};
  return topicMetadata(site, label, `/county/${params.county}`, `${label} News, ${site.state}`, `The latest news from ${label}, ${site.state}: local government, public safety, schools, weather and community stories from ${site.name}.`);
}

export default async function CountyPage({ params, searchParams }: { params: { county: string }; searchParams: { page?: string; design?: string } }) {
  const site = siteFromHeaders();
  const label = countyFor(params.county, site.state);
  if (!label) notFound();
  return <TopicPage site={site} term={label} label={label} path={`/county/${params.county}`} crumb={["Local", "/local-news"]} section="local-news" pageParam={searchParams.page} design={searchParams.design} />;
}
