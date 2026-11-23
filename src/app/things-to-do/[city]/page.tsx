import type { Metadata } from "next";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { siteFromHeaders, slugOf } from "@/lib/topic-page";
import { citiesOf } from "@/lib/local-data";
import { siteStories } from "@/lib/related-stories";
import { ensureSubmissionsTable } from "@/lib/submissions";
import { SpecialPage } from "@/lib/special-page";

/**
 * "Things to do in {City} this weekend": the paper's own recent stories about
 * events in that city plus readers' approved event submissions. Noindex until
 * there are at least 3 stories, so Google never sees a thin page.
 */
export const dynamic = "force-dynamic";

const EVENT = "(festival|fair|concert|parade|market|show|exhibit|museum|things to do|holiday|celebration|tournament|marathon|race|open house|tree lighting|light show|lights|christmas|thanksgiving|halloween|rodeo|carnival|fundraiser|gala)";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patternFor = (city: string) => `(\\m${esc(city)}\\M.*\\m${EVENT}|\\m${EVENT}.*\\m${esc(city)}\\M)`;

function cityFrom(slug: string) {
  const site = siteFromHeaders();
  const c = citiesOf(site.state).find(([n]) => slugOf(n) === slug);
  return { site, city: c?.[0] || null };
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const { site, city } = cityFrom(params.city);
  if (!city) return {};
  const n = (await siteStories(site.slug, patternFor(city), 30, 10)).length;
  return {
    title: `Things to Do in ${city} This Weekend`,
    description: `Events in ${city}, ${site.state} this weekend: festivals, concerts, markets, holiday events and community happenings, from ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/things-to-do/${params.city}` },
    robots: n >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function CityWeekend({ params }: { params: { city: string } }) {
  const { site, city } = cityFrom(params.city);
  if (!city) notFound();
  await ensureSubmissionsTable();
  const { rows: events } = await pool.query(
    `SELECT title, body, event_date, photo_url FROM submissions
      WHERE site_slug = $1 AND type = 'event' AND status = 'approved' AND reviewed_at > now() - interval '45 days' AND city ILIKE $2
      ORDER BY reviewed_at DESC LIMIT 20`,
    [site.slug, `%${city}%`]
  ).catch(() => ({ rows: [] as Array<{ title: string; body: string; event_date: string | null; photo_url: string | null }> }));
  const others = citiesOf(site.state).map(([n]) => n).filter((n) => n !== city).slice(0, 12);
  return (
    <SpecialPage
      site={site}
      path={`/things-to-do/${params.city}`}
      h1={`Things to do in ${city} this weekend`}
      answer={`Here are the events in ${city} that ${site.name} has reported on recently, plus events sent in by ${city} organizers. Dates and times can change, so check with the organizer before you go.`}
      storiesTitle={`${city} events in the news`}
      storiesPattern={patternFor(city)}
      source={`Compiled by the ${site.name} newsroom from local reporting and event submissions`}
      faqs={[
        [`What is happening in ${city} this weekend?`, `The stories on this page cover festivals, concerts, markets, holiday events and fundraisers in ${city} reported by ${site.name} in the last month, plus events submitted by local organizers.`],
        [`How do I add my ${city} event?`, `Send it through the "Submit" page on ${site.name} for free. Our editors review every submission. To feature it on the homepage, use the "Promote" page.`],
        [`Are these events free?`, `Some are and some are not. Each story and listing gives the details the organizer published; confirm prices with them directly.`],
      ]}
    >
      {events.length > 0 && (
        <section>
          <h2 className="text-[24px] font-black">Sent in by {city} organizers</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {events.map((e, i) => (
              <article key={i} className="flex gap-4 border-l-4 bg-white p-4 shadow-sm" style={{ borderColor: "var(--sp-acc)" }}>
                {e.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.photo_url} alt="" className="h-24 w-32 shrink-0 object-cover" loading="lazy" />
                )}
                <div>
                  {e.event_date && <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--sp-acc)" }}>{new Date(e.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</p>}
                  <h3 className="mt-1 text-[18px] font-bold leading-snug">{e.title}</h3>
                  <p className="mt-1 line-clamp-3 text-[14.5px] text-gray-700">{e.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <nav aria-label="Other cities" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
        <b>This weekend in:</b>
        {others.map((n) => <a key={n} href={`/things-to-do/${slugOf(n)}`} className="underline-offset-2 hover:underline">{n}</a>)}
      </nav>
    </SpecialPage>
  );
}
