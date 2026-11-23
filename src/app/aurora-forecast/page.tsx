import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getKpForecast } from "@/lib/local-data";
import { siteStories, storyHref } from "@/lib/related-stories";
import { TZ } from "@/config/timezones";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

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
  const [kp, news] = await Promise.all([getKpForecast().catch(() => null), siteStories(site.slug, "(northern lights|aurora|geomagnetic|solar storm)", 60, 6)]);
  const now = Date.now();
  const next = (kp || []).filter((p) => +new Date(p.time + "Z") > now - 3 * 3600e3).slice(0, 24);
  const best = next.reduce((m, p) => (p.kp > (m?.kp ?? -1) ? p : m), null as null | (typeof next)[number]);
  const fmt = (t: string) => new Date(t + "Z").toLocaleString("en-US", { weekday: "short", hour: "numeric", timeZone: tz, timeZoneName: "short" });
  const chance = best ? (best.kp >= need + 1 ? "Good" : best.kp >= need ? "Possible" : best.kp >= need - 1 ? "Low" : "Unlikely") : "Unknown";
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[960px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[44px]">Northern lights forecast for {site.state}</h1>
        <p className="mt-2 text-[15px] text-gray-600">From NOAA&apos;s Space Weather Prediction Center. {site.state} usually needs a Kp of about {need} or higher to see the aurora low on the northern horizon, away from city lights.</p>
        {best && (
          <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <p className="text-[13px] font-bold uppercase tracking-wide text-gray-500">Chance in {site.state} over the next 3 days</p>
            <p className="mt-1 text-[48px] font-extrabold leading-none">{chance}</p>
            <p className="mt-3 text-[17px]">The highest forecast level is Kp {best.kp.toFixed(1)} around {fmt(best.time)}. {best.kp >= need ? "Look north after dark, away from city lights." : `That is below the Kp ${need} ${site.state} usually needs.`}</p>
          </section>
        )}
        {next.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="p-3">Time</th><th className="p-3">Kp</th><th className="p-3">Type</th></tr></thead>
              <tbody className="divide-y">{next.map((p) => <tr key={p.time}><td className="p-3">{fmt(p.time)}</td><td className={`p-3 font-bold ${p.kp >= need ? "text-green-700" : ""}`}>{p.kp.toFixed(1)}</td><td className="p-3 text-gray-600">{p.kind}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {news.length > 0 && (
          <section className="mt-8"><h2 className="text-[22px] font-extrabold">Aurora news</h2>
            <ul className="mt-3 space-y-2">{news.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul></section>
        )}
        <p className="mt-6 text-[14px] text-gray-500">Source: NOAA Space Weather Prediction Center, planetary K-index forecast. Forecasts change quickly; check again in the evening.</p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
