import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { citiesOf } from "@/lib/local-data";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import NewsQuiz, { type QuizQ } from "@/components/design/NewsQuiz";

/**
 * Weekly news quiz, "Where did it happen?": real headlines from the last 7
 * days whose place leads the headline ("Bozeman: ..."), with the place hidden
 * and three other places from the same state as choices. Nothing is
 * generated, so nothing can be wrong: the answer is the paper's own headline.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} News Quiz: Where Did It Happen This Week?`,
    description: `How well do you know ${site.state}? Ten real headlines from this week, one hidden town in each. Guess where it happened.`,
    alternates: { canonical: `https://${site.domain}/quiz` },
  };
}

function seeded(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296); }

export default async function QuizPage() {
  const site = siteFromHeaders();
  const { rows } = await pool.query(
    `SELECT a.title, a.slug, a.category, a.featured_image FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.published_at > now() - interval '7 days' AND a.title ~ '^[A-Z][A-Za-z .''-]{2,30}: '
      ORDER BY a.published_at DESC LIMIT 200`,
    [site.slug]
  ).catch(() => ({ rows: [] as Array<{ title: string; slug: string; category: string; featured_image: string | null }> }));
  const withPlace = rows.map((r) => { const i = r.title.indexOf(": "); return { ...r, place: r.title.slice(0, i), rest: r.title.slice(i + 2) }; })
    .filter((r) => r.place !== site.state && !/^(update|breaking|watch|photos|video|opinion|editorial|live|exclusive)$/i.test(r.place) && !new RegExp(`\\b${r.place.replace(/[.*+?^${}()|[\]\\]/g, "")}\\b`, "i").test(r.rest));
  const pool_ = Array.from(new Set([...withPlace.map((r) => r.place), ...citiesOf(site.state).map(([n]) => n)]));
  // the same quiz all week (seeded by ISO week), different from week to week
  const week = Math.floor(Date.now() / (7 * 86400000));
  const rnd = seeded(week * 7919 + site.slug.length);
  const seen = new Set<string>();
  const qs: QuizQ[] = [];
  for (const r of withPlace) {
    if (qs.length >= 10 || seen.has(r.place)) continue;
    const wrong = pool_.filter((p) => p !== r.place).sort(() => rnd() - 0.5).slice(0, 3);
    if (wrong.length < 3) continue;
    seen.add(r.place);
    qs.push({ headline: r.rest, answer: r.place, choices: [...wrong, r.place].sort(() => rnd() - 0.5), href: `/${r.category}/${r.slug}`, image: r.featured_image });
  }
  const m = mockupOf(site.slug);
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[820px] px-4 py-10">
        <p className="text-[13px] font-black uppercase tracking-[.2em]" style={{ color: m?.acc || site.accent }}>{site.name} weekly quiz</p>
        <h1 className="mt-2 text-[34px] font-black leading-tight md:text-[48px]">Where did it happen this week?</h1>
        <p className="mt-3 text-[17px] text-gray-600">{qs.length} real {site.state} headlines from the last seven days. One town is hidden in each. Pick the right one.</p>
        {qs.length >= 4 ? <NewsQuiz questions={qs} state={site.state} siteName={site.name} domain={site.domain} ink={m?.ink || "#14213d"} acc={m?.acc || site.accent || "#b91c1c"} /> : <p className="mt-10 text-[17px]">Not enough place headlines this week yet. Check back in a day or two.</p>}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
