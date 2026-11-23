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

/** Louisiana only: Mardi Gras date, parades readers and krewes send, and the season's news. */
const FAT_TUESDAY: Record<number, string> = { 2027: "2027-02-09", 2028: "2028-02-29", 2029: "2029-02-13", 2030: "2030-03-05" };

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (site.stateAbbr !== "LA") return {};
  return {
    title: "Mardi Gras 2027: Date, Parades and Schedule in Louisiana",
    description: "When is Mardi Gras 2027? Fat Tuesday is February 9, 2027. Parades, krewes and Carnival news from New Orleans, Lafayette, Baton Rouge and across Louisiana.",
    alternates: { canonical: `https://${site.domain}/mardi-gras` },
  };
}

export default async function MardiGrasPage() {
  const site = siteFromHeaders();
  if (site.stateAbbr !== "LA") notFound();
  const now = new Date();
  const year = Object.keys(FAT_TUESDAY).map(Number).find((y) => +new Date(FAT_TUESDAY[y] + "T23:59:00-06:00") > +now) || 2027;
  const day = new Date(FAT_TUESDAY[year] + "T12:00:00-06:00");
  const days = Math.max(0, Math.ceil((+day - +now) / 86400e3));
  await ensureSubmissionsTable();
  const { rows: parades } = await pool.query(
    `SELECT title, city, event_date FROM submissions
      WHERE site_slug = $1 AND type = 'event' AND status = 'approved' AND reviewed_at > now() - interval '120 days'
        AND (title ~* 'parade|krewe|mardi gras|carnival' OR body ~* 'parade|krewe|mardi gras')
      ORDER BY reviewed_at DESC LIMIT 60`,
    [site.slug]
  );
  const news = await siteStories(site.slug, "(mardi gras|carnival|parade|krewe|king cake|fat tuesday)", 120, 12);
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[960px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[46px]">Mardi Gras {year} in Louisiana</h1>
        <section className="mt-6 rounded-lg bg-[#4b1d6b] p-6 text-white">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#f5c542]">Fat Tuesday</p>
          <p className="mt-1 text-[40px] font-extrabold leading-none">{day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" })}</p>
          <p className="mt-2 text-[18px] text-[#d9f2d0]">{days > 0 ? `${days} days to go` : "Happy Mardi Gras!"}</p>
        </section>
        <section className="mt-8"><h2 className="text-[24px] font-extrabold">Parades</h2>
          {parades.length === 0 ? <p className="mt-3 text-gray-600">Parade schedules are added as krewes and readers send them. <a href="/submit" className="font-semibold underline">Send your parade</a>.</p> : (
            <ul className="mt-3 divide-y rounded bg-white shadow-sm">{parades.map((p, i) => <li key={i} className="p-3"><b>{p.title}</b>{p.city ? ` — ${p.city}` : ""}{p.event_date ? <span className="text-gray-600"> · {p.event_date}</span> : null}</li>)}</ul>
          )}
        </section>
        {news.length > 0 && <section className="mt-8"><h2 className="text-[24px] font-extrabold">Carnival news</h2><ul className="mt-3 space-y-2">{news.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul></section>}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
