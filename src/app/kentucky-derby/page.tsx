import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["KY"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: "Kentucky Derby 2027: Date, Horses, Odds and News", description: "When is the Kentucky Derby 2027? Saturday, May 1, 2027 at Churchill Downs. Contenders, odds, post time and Derby news from Kentucky Express.", alternates: { canonical: `https://${site.domain}/kentucky-derby` } };
}

export default async function KentuckyDerbyPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/kentucky-derby" h1={"Kentucky Derby 2027: Date, Horses, Odds and News".replace(/:.*$/, "")} answer={"The 153rd Kentucky Derby runs on Saturday, May 1, 2027, at Churchill Downs in Louisville. This page follows the road to the Derby: contenders, prep races, odds and news."} storiesTitle={"Kentucky Derby news"} storiesPattern={"(kentucky derby|churchill downs|derby|kentucky oaks|thoroughbred|horse racing|triple crown)"} faqs={[["When is the Kentucky Derby 2027?", "Saturday, May 1, 2027, the first Saturday in May, at Churchill Downs in Louisville."], ["How many horses run?", "Up to 20 horses, who qualify through points earned in prep races."], ["What is the Kentucky Oaks?", "The race for 3-year-old fillies, run the day before the Derby."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
