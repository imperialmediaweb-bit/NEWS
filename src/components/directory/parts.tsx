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

export function BizCard({ b, acc, showCity = false }: { b: Business; acc: string; showCity?: boolean }) {
  const spot = isSpotlight(b);
  const cat = catBySlug(b.category);
  return (
    <article className={`relative flex gap-4 bg-white p-4 md:p-5 ${spot ? "ring-2" : "border border-gray-200"}`} style={spot ? { ["--tw-ring-color" as string]: acc } as React.CSSProperties : undefined}>
      {spot && <span className="absolute -top-3 left-4 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white" style={{ background: acc }}>★ Featured</span>}
      {b.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.photo_url} alt="" loading="lazy" className="h-20 w-20 shrink-0 object-cover md:h-24 md:w-24" />
      ) : (
        <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center bg-gray-100 text-[34px] md:h-24 md:w-24">{cat?.icon || "🏪"}</span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-[18px] font-extrabold leading-snug md:text-[20px]"><a href={bizHref(b)} className="hover:underline">{b.name}</a></h3>
        <p className="mt-0.5 text-[13px] font-semibold text-gray-500">{cat?.name}{showCity || !b.address ? ` · ${b.city}` : ""}{b.address ? ` · ${b.address}` : ""}</p>
        <div className="mt-1"><Stars value={ratingOf(b)} count={b.rating_count} /></div>
        {b.description && <p className="mt-1.5 line-clamp-2 text-[14.5px] text-gray-700">{b.description}</p>}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-bold">
          {b.phone && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} style={{ color: acc }}>☎ {b.phone}</a>}
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
  <p className="mt-10 text-[12.5px] text-gray-500">Some business details come from <a href="https://www.openstreetmap.org/copyright" className="underline" rel="noopener" target="_blank">OpenStreetMap</a> contributors (ODbL) and may be out of date. Owners can claim and correct their listing for free.</p>
);
