import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getStormReports, getAllStateAlerts } from "@/lib/local-data";

export const dynamic = "force-dynamic";
const STATES = ["OK","KS","NE","TX","IA","MO","AR","AL","MS","TN","KY","IL","IN","MN","SD","ND","LA","GA"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: `${site.state} Tornado and Severe Storm Reports Today`, description: `Tornado, hail and damaging wind reports in ${site.state} today from the NOAA Storm Prediction Center, plus active warnings and ${site.name} storm news.`, alternates: { canonical: `https://${site.domain}/tornado-reports` } };
}

export default async function TornadoReportsPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const [rep, alerts] = await Promise.all([getStormReports(site.stateAbbr).catch(() => null), getAllStateAlerts(site.stateAbbr).catch(() => null)]); const warn = (alerts || []).filter((a) => /tornado|severe thunderstorm/i.test(a.event));
  return (
    <SpecialPage site={site} path="/tornado-reports" h1={`${site.state} Tornado and Severe Storm Reports Today`.replace(/:.*$/, "")} answer={`Today in ${site.state}: ${rep ? `${rep.tornado} tornado, ${rep.hail} hail and ${rep.wind} damaging wind report${rep.wind === 1 ? "" : "s"}` : "storm reports are updating"}.${warn.length ? ` ${warn.length} tornado or severe thunderstorm warning${warn.length > 1 ? "s are" : " is"} in effect.` : " No tornado or severe thunderstorm warnings are in effect right now."}`} storiesTitle={`${site.state} severe weather news`} storiesPattern={"(tornado|severe storm|hail|damaging wind|storm damage|twister)"} faqs={[[`Were there tornadoes in ${site.state} today?`, rep ? `${rep.tornado} tornado report(s) so far today.` : "Reports are updating."], ["What is the difference between a watch and a warning?", "A watch means conditions are right for tornadoes; a warning means one is happening or about to. Take shelter at a warning."], ["Where do the reports come from?", "Preliminary local storm reports collected by the NOAA Storm Prediction Center."]] as [string, string][]} source={"Source: NOAA Storm Prediction Center, National Weather Service"}>
      {warn.length ? <Table head={["Warning", "Area"]} rows={warn.map((a) => [a.event, a.area])} /> : null}
    </SpecialPage>
  );
}
