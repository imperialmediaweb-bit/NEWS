import type { Metadata } from "next";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ensureSubmissionsTable } from "@/lib/submissions";
import { SpecialPage } from "@/lib/special-page";

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
  const answer = events.length
    ? `${events.length} show${events.length > 1 ? "s and events are" : " or event is"} listed in Las Vegas right now, sent by venues and organizers. Below them: the latest Las Vegas entertainment news.`
    : "The latest Las Vegas shows, residencies, concerts and entertainment news. Venues and organizers can send their events to be listed here.";
  return (
    <SpecialPage site={site} path="/las-vegas-shows" h1="Las Vegas Shows and Events This Week" answer={answer} storiesTitle="Las Vegas entertainment news" storiesPattern="(las vegas|the strip|residency|concert|show|casino|resort|sphere|cirque|festival)" source="Venue listings and the Nevada Express newsroom"
      faqs={[["What shows are on in Las Vegas this week?", "See the listings and entertainment news on this page; venues add their shows through Send us your news."], ["Can my show be featured?", "Yes: a featured sponsored story stays on our homepage for 7 days."], ["Are the listings free?", "Event listings are free; promotions with ticket offers run as sponsored stories."]]}>
      {events.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((e, i) => (
            <article key={i} className="flex gap-4 bg-white p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,.4)]">
              {e.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.photo_url} alt="" className="h-24 w-32 shrink-0 object-cover" loading="lazy" />
              )}
              <div className="min-w-0"><p className="text-[12px] font-black uppercase tracking-wide" style={{ color: "var(--sp-acc)" }}>{[e.event_date, e.city].filter(Boolean).join(" · ")}</p><h2 className="mt-1 text-[18px] font-bold leading-snug">{e.title}</h2><p className="mt-1 line-clamp-3 text-[14.5px] text-gray-700">{e.body}</p></div>
            </article>
          ))}
        </div>
      )}
    </SpecialPage>
  );
}
