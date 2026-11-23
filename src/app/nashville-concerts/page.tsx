import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["TN"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: "Nashville Concerts and Things to Do This Weekend", description: "Concerts, shows and things to do in Nashville this weekend: live music, Opry, Broadway, festivals and Tennessee entertainment news.", alternates: { canonical: `https://${site.domain}/nashville-concerts` } };
}

export default async function NashvilleConcertsPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/nashville-concerts" h1={"Nashville Concerts and Things to Do This Weekend".replace(/:.*$/, "")} answer={"What is on in Nashville this weekend: concerts, the Grand Ole Opry, Broadway honky-tonks, festivals and shows, with the latest Tennessee entertainment news. Venues and artists can send their events to the newsroom."} storiesTitle={"Nashville music and entertainment news"} storiesPattern={"(nashville|concert|opry|ryman|broadway|music city|festival|tour|show)"} faqs={[["What is happening in Nashville this weekend?", "See the latest concerts, shows and festivals on this page and in Things to do."], ["Can venues add events?", "Yes: send them through Send us your news; featured listings are available."], ["Where is the Grand Ole Opry?", "At the Grand Ole Opry House in Nashville, with some shows at the Ryman Auditorium."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
