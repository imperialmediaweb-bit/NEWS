import type { Business } from "@/lib/directory";
import { isSpotlight, ratingOf, bizHref } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";

export function Stars({ value, count, size = 15 }: { value: number | null; count: number; size?: number }) {
  if (!count || value == null) return <span className="text-[13px] text-gray-500">No reviews yet</span>;
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value} out of 5 from ${count} review${count === 1 ? "" : "s"}`}>
      <span style={{ fontSize: size, letterSpacing: 1 }} className="text-amber-500">{"★".repeat(full)}<span className="text-gray-300">{"★".repeat(5 - full)}</span></span>
      <b className="text-[13px]">{value.toFixed(1)}</b><span className="text-[13px] text-gray-500">({count})</span>
    </span>
  );
}

export function BizCard({ b, acc, showCity = false }: { b: Business & { locations?: number; branches?: Array<{ slug: string; address: string | null; phone: string | null }> }; acc: string; showCity?: boolean }) {
  const spot = isSpotlight(b);
  const cat = catBySlug(b.category);
  return (
    <article className={`relative flex gap-4 rounded-3xl bg-white p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,.4)] md:p-5 ${spot ? "ring-2" : "ring-1 ring-black/5"}`} style={spot ? { ["--tw-ring-color" as string]: acc } as React.CSSProperties : undefined}>
      {spot && <span className="absolute -top-3 left-5 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white shadow" style={{ background: acc }}>★ Featured · Sponsored</span>}
      {b.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.photo_url} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl object-cover md:h-24 md:w-24" />
      ) : (
        <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-200 text-[34px] md:h-24 md:w-24">{cat?.icon || "🏪"}</span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-[18px] font-extrabold leading-snug md:text-[20px]"><a href={bizHref(b)} className="hover:underline">{b.name}</a></h3>
        <p className="mt-0.5 text-[13px] font-semibold text-gray-500">{cat?.name}{showCity || !b.address || (b.branches?.length || 0) > 1 ? ` · ${b.city}` : ""}{b.address && (b.branches?.length || 0) <= 1 ? ` · ${b.address}` : ""}</p>
        <div className="mt-1"><Stars value={ratingOf(b)} count={b.rating_count} /></div>
        {(b.branches?.length || 0) > 1 && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-[13.5px] font-bold" style={{ color: acc }}>{b.branches!.length} locations in {b.city}</summary>
            <ul className="mt-1.5 space-y-1 text-[13.5px]">
              {b.branches!.map((x) => (
                <li key={x.slug}><a href={`/directory/listing/${x.slug}`} className="hover:underline">{x.address || "Location"}</a>{x.phone ? <> · <a href={`tel:${x.phone.replace(/[^\d+]/g, "")}`} style={{ color: acc }}>{x.phone}</a></> : null}</li>
              ))}
            </ul>
          </details>
        )}
        {b.description && <p className="mt-1.5 line-clamp-2 text-[14.5px] text-gray-700">{b.description}</p>}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-bold">
          {b.phone && (b.branches?.length || 0) <= 1 && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} style={{ color: acc }}>☎ {b.phone}</a>}
          {b.website && <a href={b.website} target="_blank" rel={spot ? "sponsored noopener" : "nofollow noopener"} style={{ color: acc }}>Website ›</a>}
          <a href={bizHref(b)} className="text-gray-700">Details &amp; reviews ›</a>
        </p>
      </div>
    </article>
  );
}

export function Crumbs({ items, domain }: { items: Array<[string, string]>; domain: string }) {
  const ld = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `https://${domain}${path}` })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Breadcrumb" className="text-[13px] font-semibold opacity-80">
        {items.map(([name, path], i) => <span key={path}>{i > 0 && " › "}{i < items.length - 1 ? <a href={path} className="hover:underline">{name}</a> : name}</span>)}
      </nav>
    </>
  );
}

export const OsmCredit = () => (
  <p className="mt-10 text-[12.5px] text-gray-500">Some business details come from <a href="https://www.openstreetmap.org/copyright" className="underline" rel="noopener" target="_blank">OpenStreetMap</a> contributors (ODbL) and may be out of date. Owners can claim, correct or remove their listing for free. <a href="/directory/terms" className="underline">Directory terms &amp; data sources</a>.</p>
);


/** Photo hero shared by the directory pages: full-bleed photo, dark gradient, serif title, optional side slot. */
export function PhotoHero({ photo, ink, acc, crumbs, kicker, title, sub, side }: { photo?: string | null; ink: string; acc: string; crumbs: React.ReactNode; kicker?: string; title: React.ReactNode; sub?: React.ReactNode; side?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden text-white" style={{ background: ink }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${ink}f2 0%, ${ink}c8 50%, ${ink}66 100%), linear-gradient(0deg, #000a 0%, transparent 45%)` }} />
      <div className={`relative mx-auto grid max-w-[1160px] gap-8 px-4 pb-11 pt-8 md:pb-14 ${side ? "lg:grid-cols-[1.3fr_1fr] lg:items-end" : ""}`}>
        <div>
          {crumbs}
          {kicker && <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-[12px] font-bold uppercase tracking-[.18em] ring-1 ring-white/25 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full" style={{ background: acc }} />{kicker}</p>}
          <h1 className="mt-4 font-serif text-[36px] font-black leading-[1.03] tracking-tight drop-shadow md:text-[58px]">{title}</h1>
          {sub && <div className="mt-3 max-w-[640px] text-[16.5px] leading-relaxed text-white/85 md:text-[18px]">{sub}</div>}
        </div>
        {side}
      </div>
    </section>
  );
}
