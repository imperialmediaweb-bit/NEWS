import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders, slugOf } from "@/lib/topic-page";
import { citiesOf, getForecastPeriods, getAllStateAlerts } from "@/lib/local-data";
import { TZ } from "@/config/timezones";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { siteStories, storyHref } from "@/lib/related-stories";

export const dynamic = "force-dynamic";

/** "{City} weather today": the National Weather Service forecast for one of the state's cities. */
function cityFor(param: string, state: string) {
  return citiesOf(state).find(([c]) => slugOf(c) === param) || null;
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const c = cityFor(params.city, site.state);
  if (!c) return {};
  return {
    title: `${c[0]} Weather Today and 7-Day Forecast, ${site.stateAbbr}`,
    description: `${c[0]}, ${site.state} weather today, tonight and the next 7 days from the National Weather Service, with active alerts. Updated through the day by ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/weather/${params.city}` },
  };
}

export default async function CityWeatherPage({ params }: { params: { city: string } }) {
  const site = siteFromHeaders();
  const c = cityFor(params.city, site.state);
  if (!c) notFound();
  const [city, lat, lon] = c;
  const [periods, alerts] = await Promise.all([getForecastPeriods(city, lat, lon).catch(() => null), getAllStateAlerts(site.stateAbbr).catch(() => null)]);
  const local = (alerts || []).filter((a) => a.area.toLowerCase().includes(city.toLowerCase())).slice(0, 5);
  const tz = TZ[site.state] || "America/New_York";
  const now = periods?.[0];
  const others = citiesOf(site.state).filter(([x]) => x !== city);
  const news = await siteStories(site.slug, "(weather|storm|snow|rain|flood|heat|cold|freeze|wind|tornado|hurricane|wildfire|ice|forecast)");
  const next = periods?.find((p) => p.isDay && p !== now);
  const summary = now
    ? `${city} is ${now.isDay ? "seeing" : "expecting"} ${now.short.toLowerCase()} ${now.isDay ? "today" : "tonight"}, around ${now.temp}°${now.unit}${now.rain ? `, with a ${now.rain}% chance of rain` : ""}.${next ? ` ${next.name}: ${next.short.toLowerCase()}, high near ${next.temp}°.` : ""}${local.length ? ` ${local.length} weather alert${local.length > 1 ? "s" : ""} in effect for the area.` : ""}`
    : "";
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[960px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[44px]">{city} weather today</h1>
        <p className="mt-1 text-[15px] text-gray-600">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz })} · Forecast by the National Weather Service</p>
        {summary && <p className="mt-4 max-w-[760px] text-[18px] leading-relaxed">{summary}</p>}
        {local.length > 0 && (
          <div className="mt-6 space-y-2">
            {local.map((a, i) => <p key={i} className="rounded border-l-4 border-red-700 bg-red-50 p-3 text-[15px]"><b>{a.event}:</b> {a.headline}</p>)}
          </div>
        )}
        {now ? (
          <section className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <p className="text-[13px] font-bold uppercase tracking-wide text-gray-500">{now.name}</p>
            <p className="mt-1 text-[64px] font-extrabold leading-none">{now.temp}°{now.unit}</p>
            <p className="mt-2 text-[20px] font-semibold">{now.short}</p>
            <p className="mt-3 text-[16px] text-gray-700">{now.detailed}</p>
            <p className="mt-2 text-[14px] text-gray-500">Wind {now.wind}{now.rain != null ? ` · ${now.rain}% chance of rain` : ""}</p>
          </section>
        ) : (
          <p className="mt-6 text-gray-600">The forecast is not available right now. Please check back shortly.</p>
        )}
        {periods && periods.length > 1 && (
          <section className="mt-8">
            <h2 className="text-[22px] font-extrabold">Next 7 days</h2>
            <div className="mt-3 divide-y rounded bg-white shadow-sm">
              {periods.slice(1, 14).map((p) => (
                <div key={p.name} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-3">
                  <b className="w-40 shrink-0">{p.name}</b>
                  <span className="w-16 shrink-0 text-[18px] font-bold">{p.temp}°</span>
                  <span className="min-w-0 flex-1 text-[15px] text-gray-700">{p.short}{p.rain != null ? ` · ${p.rain}% rain` : ""}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {news.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[22px] font-extrabold">{site.state} weather news</h2>
            <ul className="mt-3 space-y-2">{news.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul>
          </section>
        )}
        <section className="mt-8">
          <h2 className="text-[18px] font-bold">More {site.state} weather</h2>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            {others.map(([x]) => <a key={x} href={`/weather/${slugOf(x)}`} className="underline">{x}</a>)}
            <a href="/alerts" className="font-semibold underline">All {site.state} alerts</a>
          </p>
        </section>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
