import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ensureSubmissionsTable } from "@/lib/submissions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

export const dynamic = "force-dynamic";

/**
 * "Things to do in {State} this weekend": events readers and organizers sent
 * (approved by the editor) plus the latest event stories from the network.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `Things to Do in ${site.state} This Weekend`,
    description: `Festivals, concerts, fairs, shows and community events across ${site.state} this weekend and coming up, from ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/things-to-do` },
  };
}

const EVENT_WORDS = "(festival|fair|concert|parade|market|show|exhibit|museum|things to do|holiday|celebration|tournament|marathon|race|open house|tree lighting|light show|farmers market)";

export default async function ThingsToDoPage() {
  const site = siteFromHeaders();
  await ensureSubmissionsTable();
  const { rows: events } = await pool.query(
    `SELECT title, body, city, event_date, photo_url FROM submissions
      WHERE site_slug = $1 AND type = 'event' AND status = 'approved' AND reviewed_at > now() - interval '45 days'
      ORDER BY reviewed_at DESC LIMIT 40`,
    [site.slug]
  );
  const { rows: stories } = await pool.query(
    `SELECT a.title, a.slug, a.category, a.summary, a.featured_image, a.published_at
       FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.published_at > now() - interval '10 days'
        AND (a.category = 'life' OR a.title ~* $2)
      ORDER BY a.published_at DESC LIMIT 24`,
    [site.slug, `\\m${EVENT_WORDS}`]
  );
  const href = (a: { category: string; slug: string }) => `/${(a.category || "life").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[1100px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[46px]">Things to do in {site.state} this weekend</h1>
        <p className="mt-2 max-w-[760px] text-[17px] text-gray-600">Festivals, concerts, fairs, shows and community events across {site.state}. Organizing something? <a href="/submit" className="font-semibold underline">Send us your event</a> for free, or <a href="/promote" className="font-semibold underline">feature it on the homepage</a>.</p>

        {events.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[24px] font-extrabold">Coming up</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {events.map((e, i) => (
                <article key={i} className="flex gap-4 rounded border border-gray-200 bg-white p-4">
                  {e.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo_url} alt="" className="h-24 w-32 shrink-0 rounded object-cover" loading="lazy" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-red-700">{[e.event_date, e.city].filter(Boolean).join(" · ")}</p>
                    <h3 className="mt-1 text-[18px] font-bold leading-snug">{e.title}</h3>
                    <p className="mt-1 line-clamp-3 text-[14.5px] text-gray-700">{e.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-[24px] font-extrabold">Events and things to do in the news</h2>
          {stories.length === 0 && <p className="mt-3 text-gray-600">No event stories this week yet.</p>}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((a) => (
              <a key={a.slug} href={href(a)} className="group block">
                {a.featured_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.featured_image} alt="" className="aspect-[3/2] w-full rounded object-cover" loading="lazy" />
                )}
                <span className="mt-2 block text-[17px] font-bold leading-snug group-hover:underline">{a.title}</span>
                {a.summary && <span className="mt-1 block line-clamp-2 text-[14px] text-gray-600">{a.summary}</span>}
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
