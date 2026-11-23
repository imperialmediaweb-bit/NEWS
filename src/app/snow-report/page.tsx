import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getStateSnowMany } from "@/lib/local-data";
import { siteStories, storyHref } from "@/lib/related-stories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

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
  const [snow, news] = await Promise.all([
    getStateSnowMany(site.stateAbbr).catch(() => null),
    siteStories(site.slug, "(snow|ski|resort|avalanche|winter storm|blizzard|pass|chain law|powder)", 21, 8),
  ]);
  const deepest = (snow || []).filter((s) => s.depthIn != null).sort((a, b) => (b.depthIn || 0) - (a.depthIn || 0))[0];
  const fresh = (snow || []).filter((s) => (s.change3d || 0) > 0).sort((a, b) => (b.change3d || 0) - (a.change3d || 0))[0];
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[960px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[44px]">{site.state} snow report</h1>
        <p className="mt-2 text-[15px] text-gray-600">Measured at high-elevation USDA SNOTEL stations, updated daily.</p>
        {deepest && (
          <p className="mt-4 max-w-[760px] text-[18px] leading-relaxed">
            The deepest snow in the {site.state} mountains today is at {deepest.name}: {deepest.depthIn} inches on the ground.
            {fresh ? ` ${fresh.name} picked up the most new snow, ${fresh.change3d} inches in the last three days.` : " No new snow was measured in the last three days."}
          </p>
        )}
        {snow && snow.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="p-3">Station</th><th className="p-3">Snow depth</th><th className="p-3">Last 3 days</th><th className="p-3">Water content</th></tr></thead>
              <tbody className="divide-y">
                {snow.map((s) => (
                  <tr key={s.name}><td className="p-3 font-semibold">{s.name}</td><td className="p-3">{s.depthIn != null ? `${s.depthIn}"` : "—"}</td><td className="p-3">{s.change3d != null ? `${s.change3d > 0 ? "+" : ""}${s.change3d}"` : "—"}</td><td className="p-3">{s.sweIn != null ? `${s.sweIn}"` : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-gray-600">Snow data is not available right now. Please check back shortly.</p>
        )}
        {news.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[22px] font-extrabold">{site.state} snow and ski news</h2>
            <ul className="mt-3 space-y-2">{news.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul>
          </section>
        )}
        <p className="mt-6 text-[14px] text-gray-500">Source: USDA Natural Resources Conservation Service, SNOTEL network. Check resort reports and road conditions before you travel.</p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
