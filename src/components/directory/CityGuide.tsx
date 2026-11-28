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

export function CityHero({ city, state, total, ranked, verified, ink, acc, crumbs, photo, popular }: { city: string; state: string; total: number; ranked: number; verified: number; ink: string; acc: string; crumbs: React.ReactNode; photo?: string | null; popular: { slug: string; name: string; icon: string }[] }) {
  const year = new Date().getFullYear();
  const month = new Date().toLocaleString("en-US", { month: "long" });
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ink }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${ink}f2 0%, ${ink}cc 45%, ${ink}55 100%), linear-gradient(0deg, #000a 0%, transparent 40%)` }} />
      <div className="relative mx-auto grid max-w-[1160px] gap-8 px-4 pb-12 pt-8 md:pb-16 md:pt-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
        <div>
          {crumbs}
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-[12px] font-bold uppercase tracking-[.18em] ring-1 ring-white/25 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: acc }} /> Updated {month} {year}
          </p>
          <h1 className="mt-4 font-serif text-[42px] font-black leading-[1.0] tracking-tight drop-shadow md:text-[72px]">{city}<br />Business Guide <span style={{ color: acc }}>{year}</span></h1>
          <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-white/85 md:text-[19px]">The best local businesses in {city}, {state}, ranked the open way. Nobody can pay to move up.</p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
            {[[total.toLocaleString("en-US"), "businesses"], [String(ranked), "fields ranked"], [String(verified), verified === 1 ? "verified owner" : "verified owners"]].map(([n, l]) => (
              <div key={l}><p className="text-[30px] font-black leading-none md:text-[38px]">{n}</p><p className="mt-1 text-[12px] uppercase tracking-wider text-white/70">{l}</p></div>
            ))}
          </div>
        </div>
        <form action="/directory" className="rounded-3xl bg-white p-5 text-gray-900 shadow-2xl md:p-6">
          <p className="text-[19px] font-black">What do you need in {city}?</p>
          <input type="hidden" name="where" value={city} />
          <div className="mt-3 flex overflow-hidden rounded-2xl ring-2 ring-gray-200 focus-within:ring-gray-900">
            <input name="q" placeholder="Plumber, tacos, dentist…" aria-label="Search" className="min-w-0 flex-1 px-4 py-3.5 text-[16px] outline-none" />
            <button className="px-5 text-[15px] font-black text-white" style={{ background: acc }}>Search</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {popular.map((c) => <a key={c.slug} href={`#best-${c.slug}`} className="rounded-full bg-gray-100 px-3 py-1.5 text-[13.5px] font-semibold hover:bg-gray-200"><span aria-hidden>{c.icon}</span> {c.name}</a>)}
          </div>
        </form>
      </div>
    </section>
  );
}

export function LeaderBoards({ leaders, city, citySlug, acc, photos }: { leaders: Leader[]; city: string; citySlug: string; acc: string; photos: Record<string, string | null> }) {
  if (!leaders.length) return null;
  return (
    <section className="mx-auto max-w-[1160px] px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-black uppercase tracking-[.2em]" style={{ color: acc }}>Best of {city}</p>
          <h2 className="mt-1 font-serif text-[30px] font-black leading-tight md:text-[42px]">Top-rated, field by field</h2>
        </div>
        <a href="#how-ranked" className="rounded-full bg-white px-4 py-2 text-[14px] font-bold shadow-sm ring-1 ring-black/10 hover:ring-gray-900">How we rank ›</a>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.slice(0, 12).map((l) => {
          const c = catBySlug(l.category);
          const rated = l.top.some((b) => b.rating_count > 0 || b.claimed);
          const img = photos[l.category];
          return (
            <article id={`best-${l.category}`} key={l.category} className="group flex scroll-mt-24 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-15px_rgba(0,0,0,.35)] ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,.45)]">
              <a href={`/directory/best/${citySlug}/${l.category}`} className="relative block h-36 overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span className="absolute left-4 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-black uppercase tracking-wider text-gray-900">{l.count} ranked</span>
                <span className="absolute bottom-3 left-4 right-4 text-[21px] font-black leading-tight text-white drop-shadow"><span aria-hidden>{c?.icon} </span>Best {c?.name.toLowerCase()}</span>
              </a>
              <ol className="flex-1 space-y-1 p-3">
                {l.top.map((b, i) => (
                  <li key={b.id}>
                    <a href={`/directory/listing/${b.slug}`} className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-gray-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white shadow-md" style={{ background: `linear-gradient(145deg, ${MEDALS[i]}, ${MEDALS[i]}aa)` }}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15.5px] font-bold">{b.name}</span>
                        <span className="block truncate text-[12.5px] text-gray-500">{b.rating_count ? `★ ${(b.rating_sum / b.rating_count).toFixed(1)} · ${b.rating_count} review${b.rating_count === 1 ? "" : "s"}` : b.address || b.phone || (b.claimed ? "Owner verified" : city)}</span>
                      </span>
                      {rated && <Ring value={b.express.total} color={acc} />}
                    </a>
                  </li>
                ))}
              </ol>
              <a href={`/directory/best/${citySlug}/${l.category}`} className="mx-3 mb-3 rounded-2xl bg-gray-50 px-4 py-2.5 text-center text-[13.5px] font-bold text-gray-700 transition hover:bg-gray-900 hover:text-white">See the full top 10 ›</a>
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
