import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLACES } from "@/lib/pipeline/relevance";
import { STATE_CITIES } from "@/lib/pipeline/google-news";
import { siteFromHeaders, slugOf, topicMetadata, TopicPage } from "@/lib/topic-page";

export const dynamic = "force-dynamic";

/** /city/{name} — every story that names one of the state's cities and towns. */
const title = (x: string) => x.replace(/\b\w/g, (c) => c.toUpperCase());
function citiesOf(state: string): string[] {
  return Array.from(new Set((STATE_CITIES[state] || []).concat((PLACES[state] || []).map(title))));
}
function cityFor(param: string, state: string): string | null {
  return citiesOf(state).find((c) => slugOf(c) === param) || null;
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const city = cityFor(params.city, site.state);
  if (!city) return {};
  return topicMetadata(site, city, `/city/${params.city}`, `${city} News Today, ${site.state}`, `The latest news from ${city}, ${site.state}: police and courts, city hall, schools, traffic, weather and local business, from ${site.name}.`);
}

export default async function CityPage({ params, searchParams }: { params: { city: string }; searchParams: { page?: string; design?: string } }) {
  const site = siteFromHeaders();
  const city = cityFor(params.city, site.state);
  if (!city) notFound();
  return <TopicPage site={site} term={city} label={city} path={`/city/${params.city}`} crumb={["Local", "/local-news"]} section="local-news" pageParam={searchParams.page} design={searchParams.design} />;
}
