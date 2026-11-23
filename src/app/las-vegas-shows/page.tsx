import type { Metadata } from "next";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ensureSubmissionsTable } from "@/lib/submissions";
import { siteStories, storyHref } from "@/lib/related-stories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

export const dynamic = "force-dynamic";

/** Nevada only: Las Vegas shows, concerts and events this week. */
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (site.stateAbbr !== "NV") return {};
  return {
    title: "Las Vegas Shows and Events This Week",
    description: "Shows, concerts, residencies and events in Las Vegas this week: what is on, where and when, plus the latest entertainment news from Nevada Express.",
    alternates: { canonical: `https://${site.domain}/las-vegas-shows` },
  };
}

export default async function VegasShowsPage() {
  const site = siteFromHeaders();
  if (site.stateAbbr !== "NV") notFound();
  await ensureSubmissionsTable();
  const { rows: events } = await pool.query(
    `SELECT title, body, city, event_date, photo_url FROM submissions
      WHERE site_slug = $1 AND type = 'event' AND status = 'approved' AND reviewed_at > now() - interval '60 days'
        AND (city ILIKE '%vegas%' OR city ILIKE '%henderson%' OR title ILIKE '%vegas%' OR body ILIKE '%strip%')
      ORDER BY reviewed_at DESC LIMIT 30`,
    [site.slug]
  );
  const news = await siteStories(site.slug, "(las vegas|the strip|residency|concert|show|casino|resort|sphere|cirque|festival)", 21, 12);
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[1000px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[46px]">Las Vegas shows and events this week</h1>
        <p className="mt-2 max-w-[760px] text-[17px] text-gray-600">What is on in Las Vegas and Henderson: shows, residencies, concerts and events. Running a show? <a href="/submit" className="font-semibold underline">Send us your event</a>, or <a href="/promote" className="font-semibold underline">put it on our homepage</a>.</p>
        {events.length > 0 && (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {events.map((e, i) => (
              <article key={i} className="flex gap-4 rounded border border-gray-200 bg-white p-4">
                {e.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photo_url} alt="" className="h-24 w-32 shrink-0 rounded object-cover" loading="lazy" />
                )}
                <div className="min-w-0"><p className="text-[12px] font-bold uppercase tracking-wide text-red-700">{[e.event_date, e.city].filter(Boolean).join(" · ")}</p><h2 className="mt-1 text-[18px] font-bold leading-snug">{e.title}</h2><p className="mt-1 line-clamp-3 text-[14.5px] text-gray-700">{e.body}</p></div>
              </article>
            ))}
          </section>
        )}
        <section className="mt-10"><h2 className="text-[24px] font-extrabold">Las Vegas entertainment news</h2>
          {news.length === 0 ? <p className="mt-3 text-gray-600">No entertainment stories this week yet.</p> : <ul className="mt-3 space-y-2">{news.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul>}
        </section>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
