import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["MN","WI","MI","ND","ME","VT","NH","NY"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Ice Conditions and Ice Fishing Report`, description: `Is the ice safe? ${site.state} ice thickness guidance, ice fishing conditions and the latest ${site.name} winter lake news.`, alternates: { canonical: `https://${site.domain}/ice-fishing` } };
}

export default async function IceFishingPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/ice-fishing" h1={`${site.state} Ice Conditions and Ice Fishing Report`.replace(/:.*$/, "")} answer={`State natural resources departments advise at least 4 inches of clear, solid ice to walk on, 5 to 7 inches for a snowmobile or ATV, and 8 to 12 inches for a car or small pickup. No ice is ever guaranteed safe; check thickness yourself as you go out. Below: the latest ${site.state} ice and lake news.`} storiesTitle={`${site.state} ice and lake news`} storiesPattern={"(ice fishing|ice thickness|thin ice|lake ice|fell through|ice out|frozen lake)"} faqs={[["How thick does ice need to be to walk on?", "At least 4 inches of clear, solid ice, according to state DNR guidance."], ["How thick for a car?", "8 to 12 inches of clear ice for a car or small pickup; more for a heavier truck."], ["Is white or snow-covered ice weaker?", "Yes, white or snow-covered ice is weaker than clear ice; double the thickness."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
