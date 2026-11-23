import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getStateQuakes } from "@/lib/local-data";
import { TZ } from "@/config/timezones";

export const dynamic = "force-dynamic";
const STATES = ["CA","AK","NV","WA","OR","UT","HI","ID","MT","WY","OK","TX","NM","AZ"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `Earthquakes in ${site.state} Today`, description: `Recent earthquakes in and around ${site.state}: magnitude, location and time from the U.S. Geological Survey, updated continuously by ${site.name}.`, alternates: { canonical: `https://${site.domain}/earthquakes` } };
}

export default async function EarthquakesPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const quakes = (await getStateQuakes(site.state).catch(() => null)) || []; const tz = TZ[site.state] || "America/New_York"; const top = [...quakes].sort((a, b) => b.mag - a.mag)[0];
  return (
    <SpecialPage site={site} path="/earthquakes" h1={`Earthquakes in ${site.state} Today`.replace(/:.*$/, "")} answer={quakes.length ? `${quakes.length} earthquakes were recorded in and around ${site.state} recently. The strongest was magnitude ${top.mag.toFixed(1)}, ${top.place}, on ${new Date(top.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz })}.` : `No notable earthquakes were recorded in ${site.state} recently, according to the U.S. Geological Survey.`} storiesTitle={`${site.state} earthquake news`} storiesPattern={"(earthquake|quake|tremor|magnitude|seismic|aftershock)"} faqs={[[`Was there an earthquake in ${site.state} today?`, quakes.length ? `The strongest recent one was magnitude ${top.mag.toFixed(1)}, ${top.place}.` : "No notable earthquakes were recorded recently."], ["What magnitude can people feel?", "Most people feel earthquakes of about magnitude 2.5 to 3 and above near the epicenter; damage usually starts around magnitude 5."], ["Where does this data come from?", "From the U.S. Geological Survey real-time earthquake feed."]] as [string, string][]} source={"Source: U.S. Geological Survey"}>
      {quakes.length ? <Table head={["Magnitude", "Where", "When"]} rows={quakes.slice(0, 25).map((q) => [q.mag.toFixed(1), q.place, new Date(q.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz })])} /> : null}
    </SpecialPage>
  );
}
