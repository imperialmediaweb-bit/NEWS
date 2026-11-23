import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getStateFires } from "@/lib/local-data";

export const dynamic = "force-dynamic";
const STATES = ["CA","OR","WA","AZ","CO","ID","MT","NM","NV","UT","WY","TX","OK","AK"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Wildfire Map and Updates Today`, description: `Active wildfires in ${site.state} today: fire names, acres burned and containment from the National Interagency Fire Center, with ${site.name} fire news.`, alternates: { canonical: `https://${site.domain}/wildfires` } };
}

export default async function WildfiresPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const fires = ((await getStateFires(site.stateAbbr).catch(() => null)) || []).sort((a, b) => b.acres - a.acres); const big = fires[0];
  return (
    <SpecialPage site={site} path="/wildfires" h1={`${site.state} Wildfire Map and Updates Today`.replace(/:.*$/, "")} answer={fires.length ? `${fires.length} active wildfire${fires.length > 1 ? "s are" : " is"} burning in ${site.state}. The largest is the ${big.name} fire${big.county ? ` in ${big.county} County` : ""}, at ${Math.round(big.acres).toLocaleString("en-US")} acres${big.contained != null ? `, ${big.contained}% contained` : ""}.` : `No active wildfires are reported in ${site.state} right now by the National Interagency Fire Center.`} storiesTitle={`${site.state} fire news`} storiesPattern={"(wildfire|fire crews|acres|evacuat|containment|red flag|brush fire|forest fire)"} faqs={[[`Are there wildfires in ${site.state} right now?`, fires.length ? `Yes, ${fires.length}. The largest is the ${big.name} fire at ${Math.round(big.acres).toLocaleString("en-US")} acres.` : "None are reported right now."], ["What does containment mean?", "The share of the fire perimeter that crews have surrounded with a line the fire is not expected to cross."], ["Where do evacuation orders come from?", "County sheriffs and emergency management. Follow them first."]] as [string, string][]} source={"Source: National Interagency Fire Center"}>
      {fires.length ? <Table head={["Fire", "County", "Acres", "Contained"]} rows={fires.slice(0, 30).map((f) => [f.name, f.county || "—", Math.round(f.acres).toLocaleString("en-US"), f.contained != null ? `${f.contained}%` : "—"])} /> : null}
    </SpecialPage>
  );
}
