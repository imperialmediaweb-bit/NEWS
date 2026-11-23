import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getSubwayStatus } from "@/lib/local-data";

export const dynamic = "force-dynamic";
const STATES = ["NY"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: "NYC Subway Status Right Now: Delays by Line", description: "Is the subway running? Live NYC subway status by line from the MTA: delays, planned work and service changes, updated continuously.", alternates: { canonical: `https://${site.domain}/subway-status` } };
}

export default async function SubwayStatusPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const lines = (await getSubwayStatus().catch(() => null)) || []; const bad = lines.filter((l) => !/good/i.test(l.status));
  return (
    <SpecialPage site={site} path="/subway-status" h1={"NYC Subway Status Right Now: Delays by Line".replace(/:.*$/, "")} answer={lines.length ? (bad.length ? `${bad.length} subway line${bad.length > 1 ? "s have" : " has"} delays or changes right now: ${bad.map((l) => l.route).join(", ")}. The rest are running normally.` : "All NYC subway lines are running with good service right now.") : "Subway status is not available right now; check back shortly."} storiesTitle={"New York transit news"} storiesPattern={"(subway|mta|train|transit|commut|lirr|metro-north|path)"} faqs={[["Is the NYC subway delayed right now?", bad.length ? `Yes, on: ${bad.map((l) => l.route).join(", ")}.` : "No major delays right now."], ["Where does this data come from?", "From the MTA real-time service alerts feed."], ["Does it include weekend work?", "Yes, planned work appears as a service change on the affected lines."]] as [string, string][]} source={"Source: MTA service alerts"}>
      {lines.length ? <Table head={["Line", "Status", "Details"]} rows={lines.map((l) => [l.route, l.status, l.text || "—"])} /> : null}
    </SpecialPage>
  );
}
