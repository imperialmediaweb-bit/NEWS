import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["AZ","NV","TX","CA","NM","FL"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Heat Warnings and Heat Index Today`, description: `Is there a heat warning in ${site.state} today? Excessive heat warnings and advisories from the National Weather Service, with heat safety and ${site.name} news.`, alternates: { canonical: `https://${site.domain}/heat-index` } };
}

export default async function HeatIndexPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/heat-index" h1={`${site.state} Heat Warnings and Heat Index Today`.replace(/:.*$/, "")} answer={`Heat alerts for ${site.state} come from the National Weather Service. When an excessive heat warning is in effect, limit time outside between 10 am and 6 pm, drink water often, and check on neighbors. Active heat alerts and the latest heat news are below.`} storiesTitle={`${site.state} heat news`} storiesPattern={"(heat|excessive heat|heat wave|triple digit|cooling center|heat index|hottest)"} faqs={[[`Is there a heat warning in ${site.state} today?`, "Active heat alerts appear on our Alerts page and in the stories below."], ["What is the heat index?", "How hot it feels when humidity is added to the air temperature."], ["Where are cooling centers?", "Cities and counties open cooling centers during heat warnings; check your city website."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
