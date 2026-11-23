import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["VT","ME","NH","NY","MA","CT"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Fall Foliage Report: Peak Colors`, description: `When do the leaves change in ${site.state}? Fall foliage timing, where colors peak first, and the latest ${site.name} foliage news.`, alternates: { canonical: `https://${site.domain}/fall-foliage` } };
}

export default async function FallFoliagePage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/fall-foliage" h1={`${site.state} Fall Foliage Report: Peak Colors`.replace(/:.*$/, "")} answer={`In ${site.state}, fall colors usually start in the northern and higher elevations in late September and reach the southern and coastal areas by mid to late October. This page collects the latest foliage reports and news.`} storiesTitle={`${site.state} foliage news`} storiesPattern={"(foliage|fall colors|leaf peep|autumn|leaves|peak color)"} faqs={[[`When is peak foliage in ${site.state}?`, "Usually late September to mid October in the north and mountains, later toward the south and coast."], ["What makes a good foliage year?", "Sunny days, cool nights and enough rain over the summer."], ["Can I send foliage photos?", "Yes: use Send us your news and choose Photo or video."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
