import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const STATES = ["TX","GA","FL","OH","PA","AL","LA","CA","MS","OK"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} High School Football Scores and News`, description: `${site.state} high school football: scores, playoff results, schedules and team news from Friday night across the state, from ${site.name}.`, alternates: { canonical: `https://${site.domain}/high-school-football` } };
}

export default async function HighSchoolFootballPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  return <SpecialPage site={site} path="/high-school-football" h1={`${site.state} High School Football Scores and News`.replace(/:.*$/, "")} answer={`The latest ${site.state} high school football scores, playoff results and team news, gathered from across the state. Coaches and parents can send a final score to the newsroom.`} storiesTitle={`${site.state} high school football news`} storiesPattern={"(high school|prep|football|playoff|district|state title|uil|ghsa|fhsaa|ohsaa|piaa|varsity)"} faqs={[[`Where can I find ${site.state} high school football scores?`, "On this page, updated as games end, and in our Sports section."], ["Can I send a score?", "Yes: use Send us your news and choose Local achievement."], ["When are the state championships?", "Dates are set by the state athletic association each season; we publish the schedule as it is announced."]] as [string, string][]} source="Compiled by the newsroom from local and official sources" />;
}
