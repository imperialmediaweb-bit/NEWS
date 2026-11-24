import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getBusiness, reviewsOf, listBusinesses, isSpotlight, ratingOf, bizHref, collapseChains, categoryPhoto, nearby, storiesAbout } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { parseHours, openNow, rangeText, DAY_NAMES } from "@/lib/opening-hours";
import { TZ } from "@/config/timezones";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit, Stars } from "@/components/directory/parts";
import ReviewForm from "@/components/directory/ReviewForm";
import RemoveRequest from "@/components/directory/RemoveRequest";
import AskBiz from "@/components/directory/AskBiz";
import BizTracker from "@/components/directory/BizTracker";

/**
 * One business. LocalBusiness markup with the specific schema.org type; stars
 * only from verified reader reviews; opening hours parsed into a week table
 * with a live "Open now" badge in the state's time zone; an OpenStreetMap map;
 * nearby businesses by real distance; the paper's own stories that name the
 * business; questions answered from the listing's data (FAQPage). The hero
 * uses a free category photo and the business's own site icon.
 * Pages with nothing beyond the imported basics stay noindex, follow until
 * the owner claims the listing, adds a description or a reader reviews it.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const b = await getBusiness(site.slug, params.slug);
  if (!b) return { robots: { index: false } };
  const cat = catBySlug(b.category);
  const rich = b.claimed || b.rating_count > 0 || !!b.description;
  return {
    title: `${b.name} · ${cat?.one ? cat.one[0].toUpperCase() + cat.one.slice(1) : "Business"} in ${b.city}, ${site.stateAbbr}: Hours, Phone, Reviews`,
    description: `${b.name} in ${b.city}, ${site.state}${b.address ? ` at ${b.address}` : ""}: ${b.phone ? `phone ${b.phone}, ` : ""}opening hours, map, directions${b.rating_count ? ` and ${b.rating_count} reader review${b.rating_count === 1 ? "" : "s"}` : " and reader reviews"}.`,
    alternates: { canonical: `https://${site.domain}${bizHref(b)}` },
    robots: rich && b.status === "active" ? undefined : { index: false, follow: true },
    openGraph: b.photo_url ? { images: [b.photo_url] } : undefined,
  };
}

export default async function BusinessPage({ params, searchParams }: { params: { slug: string }; searchParams: { reviewed?: string; confirmed?: string } }) {
  const site = siteFromHeaders();
  const b = await getBusiness(site.slug, params.slug);
  if (!b) notFound();
  const cat = catBySlug(b.category);
  const [reviews, related, photo, near, news] = await Promise.all([
    reviewsOf(b.id),
    listBusinesses(site.slug, { city: b.city_slug, category: b.category, limit: 12 }),
    categoryPhoto(b.category).catch(() => null),
    b.lat != null && b.lon != null ? nearby(site.slug, b.lat, b.lon, b.id, 6).catch(() => []) : Promise.resolve([]),
    storiesAbout(site.slug, b.name).catch(() => []),
  ]);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const spot = isSpotlight(b);
  const rating = ratingOf(b);
  const url = `https://${site.domain}${bizHref(b)}`;
  const tz = TZ[site.state] || "America/New_York";
  const week = parseHours(b.hours);
  const status = week ? openNow(week, tz) : null;
  const host = b.website ? (() => { try { return new URL(b.website).hostname; } catch { return null; } })() : null;
  const icon = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : null;
  const hero = b.photo_url || photo?.url || null;
  const fullAddress = [b.address, b.city, `${site.stateAbbr}${b.zip ? ` ${b.zip}` : ""}`].filter(Boolean).join(", ");
  const mapUrl = b.lat != null && b.lon != null ? `https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lon}#map=17/${b.lat}/${b.lon}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${b.name} ${fullAddress}`)}`;
  const embed = b.lat != null && b.lon != null ? `https://www.openstreetmap.org/export/embed.html?bbox=${b.lon - 0.006}%2C${b.lat - 0.004}%2C${b.lon + 0.006}%2C${b.lat + 0.004}&layer=mapnik&marker=${b.lat}%2C${b.lon}` : null;
  const one = cat?.one || "business";

  // questions answered from the listing itself (nothing invented)
  const faqs: Array<[string, string]> = [];
  if (b.hours) faqs.push([`What are ${b.name}'s hours?`, week ? DAY_NAMES.map((d, i) => `${d}: ${rangeText(week[i])}`).join("; ") + "." : `${b.name} lists its hours as: ${b.hours}.`]);
  if (b.phone) faqs.push([`What is ${b.name}'s phone number?`, `You can call ${b.name} in ${b.city} at ${b.phone}.`]);
  if (b.address) faqs.push([`Where is ${b.name} located?`, `${b.name} is at ${fullAddress}.`]);
  if (b.website) faqs.push([`Does ${b.name} have a website?`, `Yes: ${host || b.website}.`]);
  faqs.push([`Is ${b.name} a good ${one}?`, b.rating_count ? `${b.name} has ${rating} out of 5 stars from ${b.rating_count} verified reader review${b.rating_count === 1 ? "" : "s"} on ${site.name}.` : `${b.name} has no reviews on ${site.name} yet. If you've been a customer, you can write the first review.`]);

  const ld: Record<string, unknown>[] = [{
    "@context": "https://schema.org", "@type": cat?.schema || "LocalBusiness", name: b.name, url,
    ...(b.phone ? { telephone: b.phone } : {}),
    address: { "@type": "PostalAddress", ...(b.address ? { streetAddress: b.address } : {}), addressLocality: b.city, addressRegion: site.stateAbbr, ...(b.zip ? { postalCode: b.zip } : {}), addressCountry: "US" },
    ...(b.lat != null && b.lon != null ? { geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lon } } : {}),
    ...(hero ? { image: hero } : {}),
    ...(b.description ? { description: b.description } : {}),
    ...(b.hours ? { openingHours: b.hours } : {}),
    sameAs: [b.website, b.facebook, b.instagram].filter(Boolean),
    ...(b.rating_count > 0 && rating ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: b.rating_count, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map((r) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 }, author: { "@type": "Person", name: r.name }, datePublished: String(r.created_at).slice(0, 10), reviewBody: r.body })),
    } : {}),
  }, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }];
  const badge = `<a href="${url}" target="_blank" rel="noopener"><img src="https://${site.domain}/api/directory/badge?b=${b.slug}" alt="Featured on ${site.name}" width="200" height="64"></a>`;
  const others = collapseChains(related.filter((x) => x.id !== b.id && x.name !== b.name)).slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <BizTracker slug={b.slug} />
      <Header site={site} />
      <section className="biz-hero relative overflow-hidden text-white" style={{ background: ink }}>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" aria-hidden className="biz-hero-img absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${ink} 25%, ${ink}cc 55%, ${ink}55)` }} />
        <div className="relative mx-auto max-w-[1100px] px-4 py-9 md:py-14">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [b.city, `/directory/${b.city_slug}`], [cat?.name || "Businesses", `/directory/${b.city_slug}/${b.category}`], [b.name, bizHref(b)]]} />
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,.35)] ring-4 ring-white/20 md:h-28 md:w-28">
              {b.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.photo_url} alt={b.name} className="h-full w-full object-cover" />
              ) : icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" className="h-9 w-9 object-contain [image-rendering:auto]" />
              ) : <span className="text-[48px]" aria-hidden>{cat?.icon || "🏪"}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {spot && <span className="px-2.5 py-1 text-[12px] font-black uppercase tracking-wider" style={{ background: acc }}>★ Featured</span>}
                {status && (
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold ${status.open ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/50" : "bg-white/10 text-white/80 ring-1 ring-white/25"}`}>
                    <span className="relative flex h-2.5 w-2.5">{status.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />}<span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.open ? "bg-emerald-400" : "bg-white/50"}`} /></span>
                    {status.label}
                  </span>
                )}
                {b.claimed && <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold ring-1 ring-white/25">✓ Claimed by owner</span>}
              </div>
              <h1 className="mt-2 text-[34px] font-black leading-[1.05] md:text-[52px]">{b.name}</h1>
              <p className="mt-2 text-[16px] opacity-85">{cat?.icon} {cat?.name} · {fullAddress}</p>
              <div className="mt-2 [&_*]:!text-white"><Stars value={rating} count={b.rating_count} size={18} /></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {b.phone && <a data-track="call" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="biz-btn px-5 py-3 text-[15px] font-black" style={{ background: acc }}>☎ Call {b.phone}</a>}
            {b.website && <a data-track="website" href={b.website} target="_blank" rel={spot ? "sponsored noopener" : "nofollow noopener"} className="biz-btn bg-white px-5 py-3 text-[15px] font-black" style={{ color: ink }}>Visit website ›</a>}
            <a data-track="directions" href={mapUrl} target="_blank" rel="noopener nofollow" className="biz-btn border border-white/50 px-5 py-3 text-[15px] font-bold backdrop-blur">Directions</a>
            <a href="#review" className="biz-btn border border-white/50 px-5 py-3 text-[15px] font-bold backdrop-blur">★ Review</a>
          </div>
        </div>
        {photo?.credit && !b.photo_url && <p className="absolute bottom-1.5 right-3 text-[10.5px] opacity-60">{photo.credit}</p>}
      </section>

      <main className="mx-auto grid max-w-[1100px] gap-8 px-4 py-9 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0">
          {searchParams.reviewed && <p className="mb-6 bg-green-50 p-4 font-semibold text-green-800">Thanks! Check your email and click the link to publish your review.</p>}
          {searchParams.confirmed && <p className="mb-6 bg-green-50 p-4 font-semibold text-green-800">Your review is published. Thank you!</p>}

          {/* at a glance */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Rating", rating ? `★ ${rating.toFixed(1)}` : "New", b.rating_count ? `${b.rating_count} reviews` : "Be the first"],
              ["Status", status ? (status.open ? "Open" : "Closed") : "—", status ? status.label.replace(/^(Open now|Closed) · /, "") : "Hours not listed"],
              ["Category", cat?.icon || "🏪", cat?.name || "Business"],
              ["Town", b.city, site.state],
            ].map(([k, v, s]) => (
              <div key={k} className="biz-tile bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[.16em] text-gray-500">{k}</p>
                <p className="mt-1 truncate text-[20px] font-black" style={{ color: k === "Status" && status?.open ? "#059669" : undefined }}>{v}</p>
                <p className="truncate text-[12.5px] text-gray-500">{s}</p>
              </div>
            ))}
          </div>

          <AskBiz slug={b.slug} name={b.name} acc={acc} hasHours={!!b.hours} hasReviews={b.rating_count > 0} />

          {b.description && <section className="mt-8"><h2 className="text-[22px] font-black">About {b.name}</h2><p className="mt-2 whitespace-pre-line text-[17px] leading-relaxed text-gray-800">{b.description}</p></section>}
          {b.article_slug && <p className="mt-4"><a href={`/${b.article_slug}`} className="font-bold underline" style={{ color: acc }}>Read the Business Spotlight profile ›</a></p>}

          {week && (
            <section className="mt-8">
              <h2 className="text-[22px] font-black">Opening hours</h2>
              <table className="mt-3 w-full overflow-hidden bg-white text-[15px] shadow-sm">
                <tbody>
                  {DAY_NAMES.map((d, i) => (
                    <tr key={d} className={i === status?.today ? "font-bold" : ""} style={i === status?.today ? { background: `${acc}14` } : undefined}>
                      <td className="border-b border-gray-100 px-4 py-2.5">{d}{i === status?.today && <span className="ml-2 text-[11px] font-black uppercase tracking-wider" style={{ color: acc }}>Today</span>}</td>
                      <td className="border-b border-gray-100 px-4 py-2.5 text-right">{rangeText(week[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1.5 text-[12.5px] text-gray-500">Times in {b.city} local time. Holiday hours may differ; call ahead.</p>
            </section>
          )}

          {embed && (
            <section className="mt-8">
              <h2 className="text-[22px] font-black">Map</h2>
              <div className="mt-3 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5">
                <iframe title={`Map of ${b.name}`} src={embed} loading="lazy" className="h-[320px] w-full border-0" />
              </div>
              <p className="mt-1.5 text-[13px]"><a href={mapUrl} target="_blank" rel="noopener nofollow" className="font-bold underline" style={{ color: acc }}>Open larger map &amp; directions ›</a></p>
            </section>
          )}

          {news.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[22px] font-black">{b.name} in the news</h2>
              <ul className="mt-3 space-y-2">
                {news.map((n) => <li key={n.slug} className="border-l-4 bg-white p-3 shadow-sm" style={{ borderColor: acc }}><a href={`/${n.category}/${n.slug}`} className="font-bold hover:underline">{n.title}</a><span className="block text-[12.5px] text-gray-500">{new Date(n.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {site.name}</span></li>)}
              </ul>
            </section>
          )}

          <section className="mt-8" id="reviews">
            <h2 className="text-[22px] font-black">Reviews of {b.name}</h2>
            {reviews.length ? (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-l-4 bg-white p-4" style={{ borderColor: acc }}>
                    <p className="text-amber-500">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></p>
                    <p className="mt-1 text-[16px] text-gray-800">{r.body}</p>
                    <p className="mt-1.5 text-[13px] text-gray-500">{r.name} · {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Verified email</p>
                    {r.owner_reply && <p className="mt-2 bg-gray-50 p-3 text-[14.5px]"><b>Owner&apos;s reply:</b> {r.owner_reply}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-[16px] text-gray-600">No reviews yet. Be the first to review {b.name}.</p>}
          </section>
          <section className="mt-8 scroll-mt-24" id="review"><ReviewForm slug={b.slug} name={b.name} acc={acc} /></section>

          <section className="mt-10">
            <h2 className="text-[22px] font-black">Questions about {b.name}</h2>
            <div className="mt-3 divide-y border-y bg-white">
              {faqs.map(([q, a]) => <details key={q} className="p-4"><summary className="cursor-pointer text-[16px] font-bold">{q}</summary><p className="mt-2 text-[15px] text-gray-700">{a}</p></details>)}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="bg-white p-5 shadow-sm">
            <h2 className="text-[17px] font-black">Contact</h2>
            <dl className="mt-3 space-y-2.5 text-[15px]">
              {b.address && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Address</dt><dd>{fullAddress}</dd></div>}
              {b.phone && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Phone</dt><dd><a data-track="call" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="font-bold" style={{ color: acc }}>{b.phone}</a></dd></div>}
              {host && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Website</dt><dd><a href={b.website!} target="_blank" rel={spot ? "sponsored noopener" : "nofollow noopener"} className="underline">{host}</a></dd></div>}
              {!week && b.hours && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Hours</dt><dd className="whitespace-pre-line">{b.hours.replace(/;\s*/g, "\n")}</dd></div>}
              {(b.facebook || b.instagram) && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Social</dt><dd className="flex gap-3">{b.facebook && <a href={b.facebook} target="_blank" rel="nofollow noopener" className="underline">Facebook</a>}{b.instagram && <a href={b.instagram} target="_blank" rel="nofollow noopener" className="underline">Instagram</a>}</dd></div>}
            </dl>
          </div>

          {near.length > 0 && (
            <div className="bg-white p-5 shadow-sm">
              <h2 className="text-[17px] font-black">Nearby</h2>
              <ul className="mt-3 space-y-2.5">
                {near.map((x) => (
                  <li key={x.id} className="flex items-start justify-between gap-3 text-[14.5px]">
                    <a href={bizHref(x)} className="hover:underline"><b>{x.name}</b><span className="block text-[12.5px] text-gray-500">{catBySlug(x.category)?.icon} {catBySlug(x.category)?.name}</span></a>
                    <span className="shrink-0 text-[12.5px] font-bold text-gray-500">{x.miles < 0.1 ? "next door" : `${x.miles.toFixed(1)} mi`}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-5 text-white" style={{ background: ink }}>
            <h2 className="text-[17px] font-black">{b.claimed ? "Is this your business?" : "Own this business?"}</h2>
            <p className="mt-1.5 text-[14.5px] opacity-90">{b.claimed ? "Update your details or get to the top of the list with Business Spotlight." : "Claim it free to add photos, hours and a description, or get Business Spotlight: top of the list for 12 months plus a profile article."}</p>
            <a href={`/directory/join?b=${b.slug}`} className="mt-3 inline-block px-4 py-2.5 text-[14px] font-black" style={{ background: acc }}>{b.claimed ? "Update or upgrade ›" : "Claim this listing ›"}</a>
            <a href={`/api/directory/qr?b=${b.slug}&format=sign`} target="_blank" rel="noopener" className="mt-3 flex items-center gap-3 rounded-lg bg-white/10 p-2.5 text-[13.5px] font-bold ring-1 ring-white/20 hover:bg-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/directory/qr?b=${b.slug}`} alt="" className="h-14 w-14 rounded bg-white p-1" />
              <span>Print your free “Review us” QR sign for the counter ›</span>
            </a>
            <p className="mt-3 text-[13px] opacity-75">Something wrong? <a href={`/contact?subject=${encodeURIComponent(`Directory correction: ${b.name}`)}`} className="underline">Report a change</a></p>
            <div className="mt-2"><RemoveRequest slug={b.slug} name={b.name} /></div>
          </div>
          {spot && (
            <div className="bg-white p-5 shadow-sm">
              <h2 className="text-[15px] font-black">Badge for your website</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/directory/badge?b=${b.slug}`} alt={`Featured on ${site.name}`} width={200} height={64} className="mt-2" />
              <textarea readOnly value={badge} className="mt-2 h-24 w-full border p-2 font-mono text-[11px]" aria-label="Badge code" />
            </div>
          )}
        </aside>
      </main>

      {others.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-4 pb-10">
          <h2 className="text-[22px] font-black">More {cat?.name.toLowerCase()} in {b.city}</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">{others.map((x) => <BizCard key={x.id} b={x} acc={acc} />)}</div>
          <p className="mt-4"><a href={`/directory/${b.city_slug}/${b.category}`} className="font-bold underline">All {cat?.name.toLowerCase()} in {b.city} ›</a></p>
        </section>
      )}
      <div className="mx-auto max-w-[1100px] px-4 pb-10">{b.source.startsWith("osm") && <OsmCredit />}</div>
      <style dangerouslySetInnerHTML={{ __html: `.biz-hero-img{animation:bizZoom 22s ease-in-out infinite alternate}@keyframes bizZoom{from{transform:scale(1.04)}to{transform:scale(1.12)}}.biz-btn{transition:transform .2s ease,box-shadow .2s ease}.biz-btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}.biz-tile{transition:transform .25s ease,box-shadow .25s ease}.biz-tile:hover{transform:translateY(-3px);box-shadow:0 14px 30px -18px rgba(0,0,0,.45)}@media (prefers-reduced-motion:reduce){.biz-hero-img{animation:none}}` }} />
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
