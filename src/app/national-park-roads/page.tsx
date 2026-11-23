import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["MT","WY","UT","AZ","CO","CA","WA"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} National Park Roads and Conditions`, description: `Which ${site.state} national park roads are open? Seasonal road openings, closures and park news from ${site.name}.`, alternates: { canonical: `https://${site.domain}/national-park-roads` } };
}

export default async function NationalParkRoadsPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/national-park-roads" h1={`${site.state} National Park Roads and Conditions`.replace(/:.*$/, "")} answer={`Many ${site.state} national park roads close for the winter and reopen in spring as crews clear snow. Before you go, check the park service alerts and road status for the park you are visiting. Below: the latest park and road news.`} storiesTitle={`${site.state} park news`} storiesPattern={"(national park|yellowstone|glacier|grand teton|zion|grand canyon|road closure|going-to-the-sun|park service)"} faqs={[["When do park roads open?", "Most high roads reopen between April and June, depending on snow."], ["Where are official road conditions?", "On each park National Park Service page and the state transportation department."], ["Do I need a reservation?", "Some parks require timed-entry reservations in summer; check the park page."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
