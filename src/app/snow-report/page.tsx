import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getStateSnowMany } from "@/lib/local-data";
import { SpecialPage, Table } from "@/lib/special-page";

export const dynamic = "force-dynamic";
const SNOW_STATES = ["AK", "AZ", "CA", "CO", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY", "SD"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!SNOW_STATES.includes(site.stateAbbr)) return {};
  return {
    title: `${site.state} Snow Report Today: Mountain Snow Depth`,
    description: `How much snow is on the ground in the ${site.state} mountains today, and how much fell in the last three days, from the USDA SNOTEL network. Updated daily by ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/snow-report` },
  };
}

export default async function SnowReportPage() {
  const site = siteFromHeaders();
  if (!SNOW_STATES.includes(site.stateAbbr)) notFound();
  const snow = await getStateSnowMany(site.stateAbbr).catch(() => null);
  const deepest = (snow || []).filter((s) => s.depthIn != null).sort((a, b) => (b.depthIn || 0) - (a.depthIn || 0))[0];
  const fresh = (snow || []).filter((s) => (s.change3d || 0) > 0).sort((a, b) => (b.change3d || 0) - (a.change3d || 0))[0];
  const answer = deepest
    ? `The deepest snow in the ${site.state} mountains today is at ${deepest.name}: ${deepest.depthIn} inches on the ground.${fresh ? ` ${fresh.name} picked up the most new snow, ${fresh.change3d} inches in the last three days.` : " No new snow was measured in the last three days."}`
    : `Snow measurements for ${site.state} are updating; check back shortly.`;
  return (
    <SpecialPage site={site} path="/snow-report" h1={`${site.state} Snow Report Today`} answer={answer} storiesTitle={`${site.state} snow and ski news`} storiesPattern="(snow|ski|resort|avalanche|winter storm|blizzard|pass|chain law|powder)" source="Source: USDA NRCS SNOTEL network"
      faqs={[[`How much snow is in the ${site.state} mountains?`, deepest ? `Up to ${deepest.depthIn} inches at ${deepest.name}.` : "Measurements are updating."], ["What is snow water content?", "How much water the snowpack holds if it melted; it matters for spring runoff and water supply."], ["Where does the data come from?", "From automated USDA SNOTEL stations at high elevations, reporting daily."]]}>
      {snow && snow.length ? <Table head={["Station", "Snow depth", "Last 3 days", "Water content"]} rows={snow.map((x) => [x.name, x.depthIn != null ? `${x.depthIn}"` : "—", x.change3d != null ? `${x.change3d > 0 ? "+" : ""}${x.change3d}"` : "—", x.sweIn != null ? `${x.sweIn}"` : "—"])} /> : null}
    </SpecialPage>
  );
}
