import type { Business } from "@/lib/directory";
import type { Score } from "@/lib/express-score";
import { catBySlug } from "@/lib/directory-categories";

/**
 * City guide blocks, editorial style: a hero with the city's numbers, a bento
 * of "best of" boards with gold/silver/bronze places, and how the ranking
 * works. Scores show only where readers have reviewed or the owner confirmed
 * the listing; elsewhere the board says it is waiting for its first review,
 * so identical numbers never pretend to be a ranking.
 */
type Leader = { category: string; count: number; top: (Business & { express: Score })[] };
const MEDALS = ["#C9A227", "#9CA3AF", "#B4723A"];

function Ring({ value, color }: { value: number; color: string }) {
  const r = 17, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center" title={`Express Score ${value}/100`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90"><circle cx="20" cy="20" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" /><circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} /></svg>
      <span className="text-[13px] font-black">{value}</span>
    </span>
  );
}

export function CityHero({ city, state, total, ranked, verified, ink, acc, crumbs }: { city: string; state: string; total: number; ranked: number; verified: number; ink: string; acc: string; crumbs: React.ReactNode }) {
  const year = new Date().getFullYear();
  const month = new Date().toLocaleString("en-US", { month: "long" });
  return (
    <section className="relative overflow-hidden text-white" style={{ background: `radial-gradient(1200px 500px at 85% -10%, ${acc}55, transparent 60%), linear-gradient(160deg, ${ink}, #0b1020)` }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="relative mx-auto max-w-[1160px] px-4 pb-12 pt-8 md:pb-16 md:pt-10">
        {crumbs}
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-bold uppercase tracking-[.18em] ring-1 ring-white/20">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: acc }} /> Updated {month} {year}
        </p>
        <h1 className="mt-4 font-serif text-[40px] font-black leading-[1.02] tracking-tight md:text-[68px]">
          The {city}<br className="hidden md:block" /> Business Guide <span style={{ color: acc }}>{year}</span>
        </h1>
        <p className="mt-4 max-w-[680px] text-[17px] leading-relaxed text-white/80 md:text-[19px]">
          Every local business in {city}, {state}, ranked the same open way: verified reader reviews, a complete profile and a confirmed owner. Nobody can pay to move up.
        </p>
        <div className="mt-8 grid max-w-[720px] grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/15">
          {[[total.toLocaleString("en-US"), "local businesses"], [ranked.toLocaleString("en-US"), "fields ranked"], [verified.toLocaleString("en-US"), verified === 1 ? "verified owner" : "verified owners"]].map(([n, l]) => (
            <div key={l} className="bg-white/[0.06] px-4 py-4 backdrop-blur"><p className="text-[26px] font-black leading-none md:text-[34px]">{n}</p><p className="mt-1 text-[12.5px] uppercase tracking-wider text-white/65">{l}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LeaderBoards({ leaders, city, citySlug, acc }: { leaders: Leader[]; city: string; citySlug: string; acc: string }) {
  if (!leaders.length) return null;
  return (
    <section className="mx-auto max-w-[1160px] px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-black uppercase tracking-[.2em]" style={{ color: acc }}>Best of {city}</p>
          <h2 className="mt-1 font-serif text-[30px] font-black leading-tight md:text-[40px]">Top-rated, field by field</h2>
        </div>
        <a href="#how-ranked" className="rounded-full border border-gray-300 px-4 py-2 text-[14px] font-bold hover:border-gray-900">How we rank ›</a>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaders.slice(0, 12).map((l, idx) => {
          const c = catBySlug(l.category);
          const rated = l.top.some((b) => b.rating_count > 0 || b.claimed);
          return (
            <article key={l.category} className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,.04),0_8px_30px_-12px_rgba(0,0,0,.18)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,.28)] ${idx === 0 ? "lg:col-span-2" : ""}`}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: acc }} />
              <a href={`/directory/best/${citySlug}/${l.category}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-[24px]" aria-hidden>{c?.icon}</span>
                <span><span className="block text-[12px] font-bold uppercase tracking-wider text-gray-500">{l.count} ranked</span><span className="block text-[18px] font-black leading-tight group-hover:underline">Best {c?.name.toLowerCase()}</span></span>
              </a>
              <ol className={`mt-4 flex-1 space-y-2.5 ${idx === 0 ? "lg:grid lg:grid-cols-3 lg:items-start lg:content-start lg:gap-3 lg:space-y-0" : ""}`}>
                {l.top.map((b, i) => (
                  <li key={b.id} className={`flex items-center gap-3 rounded-xl p-2.5 ${i === 0 ? "bg-amber-50/70 ring-1 ring-amber-200/70" : "bg-gray-50"}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-black text-white shadow" style={{ background: MEDALS[i] }}>{i + 1}</span>
                    <a href={`/directory/listing/${b.slug}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold hover:underline">{b.name}</span>
                      <span className="block truncate text-[12.5px] text-gray-500">{b.rating_count ? `★ ${(b.rating_sum / b.rating_count).toFixed(1)} · ${b.rating_count} review${b.rating_count === 1 ? "" : "s"}` : b.claimed ? "Owner verified" : "Awaiting first review"}</span>
                    </a>
                    {rated && <Ring value={b.express.total} color={acc} />}
                  </li>
                ))}
              </ol>
              {!rated && <p className="mt-3 text-[12.5px] text-gray-500">No reader reviews here yet. <a href={`/directory/best/${citySlug}/${l.category}`} className="font-bold underline">Review a {c?.one}</a> and shape this list.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HowRanked({ acc }: { acc: string }) {
  const parts = [["Reviews", 55, "Stars from readers who confirmed their email, weighted so one review can't beat many."], ["Profile", 30, "Hours, phone, website, a real description and a photo."], ["Owner verified", 15, "The owner claimed and confirmed the listing."]] as const;
  return (
    <section id="how-ranked" className="mx-auto max-w-[1160px] px-4 pb-14">
      <div className="rounded-3xl bg-gray-950 p-6 text-white md:p-10">
        <p className="text-[12.5px] font-black uppercase tracking-[.2em]" style={{ color: acc }}>Transparent by design</p>
        <h2 className="mt-1 font-serif text-[28px] font-black md:text-[36px]">How the Express Score works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {parts.map(([t, n, d]) => (
            <div key={t} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
              <p className="text-[40px] font-black leading-none" style={{ color: acc }}>{n}<span className="text-[16px] text-white/50"> pts</span></p>
              <p className="mt-2 text-[17px] font-bold">{t}</p>
              <p className="mt-1 text-[14.5px] text-white/70">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[14.5px] text-white/70">Money never changes the score. Sponsored places are shown apart and always labelled. Owners raise their score for free by completing their profile and asking customers for honest reviews.</p>
      </div>
    </section>
  );
}
