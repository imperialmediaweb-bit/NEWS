import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getActiveStorms } from "@/lib/local-data";

export const dynamic = "force-dynamic";
const STATES = ["FL","LA","TX","NC","SC","GA","AL","MS","HI"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Hurricane Tracker: Active Storms Today`, description: `Live tropical storm and hurricane tracker for ${site.state}: active storms from the National Hurricane Center, their strength and movement, and ${site.name} storm news.`, alternates: { canonical: `https://${site.domain}/hurricane-tracker` } };
}

export default async function HurricaneTrackerPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const data = await getActiveStorms().catch(() => null); const storms = data?.storms || [];
  return (
    <SpecialPage site={site} path="/hurricane-tracker" h1={`${site.state} Hurricane Tracker: Active Storms Today`.replace(/:.*$/, "")} answer={storms.length ? `${storms.length} active tropical system${storms.length > 1 ? "s" : ""} in the Atlantic and eastern Pacific right now: ${storms.map((s) => `${s.classification} ${s.name}`).join(", ")}. Check the details below and follow local officials for ${site.state} watches and warnings.` : `There are no active tropical storms or hurricanes in the Atlantic or eastern Pacific right now, according to the National Hurricane Center. This page updates automatically when a storm forms.`} storiesTitle={`${site.state} storm news`} storiesPattern={"(hurricane|tropical storm|storm surge|evacuat|landfall|national hurricane center)"} faqs={[[`Is there a hurricane near ${site.state} right now?`, storms.length ? `Yes, ${storms.length} tropical system(s) are active: ${storms.map((s) => s.name).join(", ")}.` : "No active tropical storms or hurricanes right now."], ["When is hurricane season?", "The Atlantic hurricane season runs from June 1 to November 30, with the peak from mid-August to mid-October."], [`Where do ${site.state} evacuation orders come from?`, "Evacuation orders are issued by county emergency management and the governor. Follow them first; this page shows the National Hurricane Center data."]] as [string, string][]} source={"Source: National Hurricane Center (NOAA)"}>
      {storms.length ? <Table head={["Storm", "Type", "Strength", "Movement"]} rows={storms.map((s) => [s.name, s.classification, s.intensity, s.movement])} /> : null}
    </SpecialPage>
  );
}
