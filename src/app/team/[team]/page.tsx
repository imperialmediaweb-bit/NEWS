import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEAMS } from "@/lib/pipeline/google-news";
import { STATE_FACTS } from "@/config/state-data";
import { siteFromHeaders, slugOf, topicMetadata, TopicPage } from "@/lib/topic-page";

export const dynamic = "force-dynamic";

/** /team/{name} — every story about one of the state's pro or college teams. */
function teamsOf(state: string): string[] {
  return (TEAMS[state] || STATE_FACTS[state]?.teams || []).filter((t) => t.length >= 4);
}
function teamFor(param: string, state: string): string | null {
  return teamsOf(state).find((t) => slugOf(t) === param) || null;
}

export async function generateMetadata({ params }: { params: { team: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const team = teamFor(params.team, site.state);
  if (!team) return {};
  return topicMetadata(site, team, `/team/${params.team}`, `${team} News, Scores and Updates`, `The latest ${team} news from ${site.name}: games, scores, roster moves, injuries and what it means for ${site.state} fans.`);
}

export default async function TeamPage({ params, searchParams }: { params: { team: string }; searchParams: { page?: string; design?: string } }) {
  const site = siteFromHeaders();
  const team = teamFor(params.team, site.state);
  if (!team) notFound();
  return <TopicPage site={site} term={team} label={team} path={`/team/${params.team}`} crumb={["Sports", "/sports"]} section="sports" pageParam={searchParams.page} design={searchParams.design} />;
}
