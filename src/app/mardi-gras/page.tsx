import type { Metadata } from "next";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ensureSubmissionsTable } from "@/lib/submissions";
import { SpecialPage } from "@/lib/special-page";

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
  const when = day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
  return (
    <SpecialPage site={site} path="/mardi-gras" h1={`Mardi Gras ${year} in Louisiana`} answer={`Mardi Gras ${year}, Fat Tuesday, is ${when}${days > 0 ? `: ${days} days from today` : ""}. Carnival season starts on January 6 and the biggest parades roll in the two weeks before Fat Tuesday.`} storiesTitle="Carnival news" storiesPattern="(mardi gras|carnival|parade|krewe|king cake|fat tuesday)" source="Krewe and reader listings, Louisiana Express newsroom"
      faqs={[[`When is Mardi Gras ${year}?`, `Fat Tuesday is ${when}.`], ["When does Carnival season start?", "On January 6, Twelfth Night; parades build toward Fat Tuesday."], ["Can krewes add their parade?", "Yes: send the route, date and time through Send us your news."]]}>
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="bg-[#4b1d6b] p-6 text-white">
          <p className="text-[13px] font-black uppercase tracking-wide text-[#f5c542]">Fat Tuesday</p>
          <p className="mt-2 text-[34px] font-black leading-none">{when}</p>
          <p className="mt-3 text-[56px] font-black leading-none text-[#5fd068]">{days}<span className="ml-2 text-[18px] text-white/80">days to go</span></p>
        </div>
        <div className="bg-white p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,.4)]">
          <h2 className="text-[20px] font-black">Parades</h2>
          {parades.length === 0 ? <p className="mt-2 text-gray-600">Parade schedules are added as krewes and readers send them. <a href="/submit" className="font-bold underline">Send your parade</a>.</p> : (
            <ul className="mt-2 divide-y">{parades.map((p, i) => <li key={i} className="py-2"><b>{p.title}</b>{p.city ? ` — ${p.city}` : ""}{p.event_date ? <span className="text-gray-600"> · {p.event_date}</span> : null}</li>)}</ul>
          )}
        </div>
      </div>
    </SpecialPage>
  );
}
