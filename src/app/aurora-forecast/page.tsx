import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getKpForecast } from "@/lib/local-data";
import { TZ } from "@/config/timezones";
import { SpecialPage, Table } from "@/lib/special-page";

export const dynamic = "force-dynamic";

/** Kp level at which the northern lights can usually be seen low on the northern horizon, per state. */
const KP_NEEDED: Record<string, number> = { AK: 2, ND: 5, MN: 5, ME: 5, MT: 5, WA: 6, ID: 6, WI: 6, MI: 6, VT: 6, NH: 6, SD: 6, NY: 7, OR: 7, WY: 7, IA: 7, MA: 7 };

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!KP_NEEDED[site.stateAbbr]) return {};
  return {
    title: `Northern Lights Forecast for ${site.state} Tonight`,
    description: `Can you see the northern lights in ${site.state} tonight? The aurora forecast from NOAA's Space Weather Prediction Center, with the Kp level ${site.state} needs. Updated through the day.`,
    alternates: { canonical: `https://${site.domain}/aurora-forecast` },
  };
}

export default async function AuroraPage() {
  const site = siteFromHeaders();
  const need = KP_NEEDED[site.stateAbbr];
  if (!need) notFound();
  const tz = TZ[site.state] || "America/New_York";
  const kp = await getKpForecast().catch(() => null);
  const now = Date.now();
  const next = (kp || []).filter((p) => +new Date(p.time + "Z") > now - 3 * 3600e3).slice(0, 24);
  const best = next.reduce((m, p) => (p.kp > (m?.kp ?? -1) ? p : m), null as null | (typeof next)[number]);
  const fmt = (t: string) => new Date(t + "Z").toLocaleString("en-US", { weekday: "short", hour: "numeric", timeZone: tz, timeZoneName: "short" });
  const chance = best ? (best.kp >= need + 1 ? "good" : best.kp >= need ? "possible" : best.kp >= need - 1 ? "low" : "unlikely") : "unknown";
  const answer = best ? `The chance of seeing the northern lights in ${site.state} over the next three days is ${chance}. The highest forecast level is Kp ${best.kp.toFixed(1)} around ${fmt(best.time)}; ${site.state} usually needs about Kp ${need}.` : "The aurora forecast is updating; check back shortly.";
  return (
    <SpecialPage site={site} path="/aurora-forecast" h1={`Northern Lights Forecast for ${site.state}`} answer={answer} storiesTitle="Aurora news" storiesPattern="(northern lights|aurora|geomagnetic|solar storm)" source="Source: NOAA Space Weather Prediction Center"
      faqs={[[`Can I see the northern lights in ${site.state} tonight?`, `The chance is ${chance}. Look north after dark, away from city lights.`], ["What is the Kp index?", "A 0 to 9 scale of geomagnetic activity; the higher it is, the farther south the aurora can be seen."], ["When is the best time to look?", "Usually between 10 pm and 2 am local time, on clear nights with little moonlight."]]}>
      {next.length ? <Table head={["Time", "Kp", "Type"]} rows={next.map((p) => [fmt(p.time), p.kp.toFixed(1), p.kind])} /> : null}
    </SpecialPage>
  );
}
