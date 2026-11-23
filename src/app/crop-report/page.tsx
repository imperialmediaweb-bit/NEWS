import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["IA","NE","KS","IL","IN","MN","ND","SD","MO","OH"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Crop Report and Harvest News`, description: `${site.state} corn, soybean and wheat progress, harvest news and farm market stories, from ${site.name}.`, alternates: { canonical: `https://${site.domain}/crop-report` } };
}

export default async function CropReportPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/crop-report" h1={`${site.state} Crop Report and Harvest News`.replace(/:.*$/, "")} answer={`The latest on ${site.state} crops: planting and harvest progress, crop conditions, farm markets and agriculture news. The USDA publishes its national Crop Progress report every Monday afternoon during the growing season.`} storiesTitle={`${site.state} farm news`} storiesPattern={"(crop|harvest|corn|soybean|wheat|farmer|farm|usda|planting|grain|cattle)"} faqs={[["When does the USDA publish the crop progress report?", "Every Monday at 4 pm Eastern during the growing season."], ["Where can I find local grain prices?", "At local elevators and cooperatives; we report market moves in our business section."], ["Can farmers send news?", "Yes: use Send us your news."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
