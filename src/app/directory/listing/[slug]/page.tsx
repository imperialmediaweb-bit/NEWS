import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getBusiness, reviewsOf, listBusinesses, isSpotlight, ratingOf, bizHref } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit, Stars } from "@/components/directory/parts";
import ReviewForm from "@/components/directory/ReviewForm";
import RemoveRequest from "@/components/directory/RemoveRequest";

/**
 * One business. LocalBusiness markup with the specific schema.org type; stars
 * only from verified reader reviews. Pages with nothing beyond the imported
 * basics stay out of the index (noindex, follow) until the owner claims the
 * listing, adds a description or a reader reviews it.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const b = await getBusiness(site.slug, params.slug);
  if (!b) return { robots: { index: false } };
  const cat = catBySlug(b.category);
  const rich = b.claimed || b.rating_count > 0 || !!b.description;
  return {
    title: `${b.name} · ${cat?.one ? cat.one[0].toUpperCase() + cat.one.slice(1) : "Business"} in ${b.city}, ${site.stateAbbr}`,
    description: `${b.name} in ${b.city}, ${site.state}${b.address ? ` at ${b.address}` : ""}: ${b.phone ? `phone ${b.phone}, ` : ""}hours, website${b.rating_count ? ` and ${b.rating_count} reader review${b.rating_count === 1 ? "" : "s"}` : " and reader reviews"}.`,
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
  const [reviews, related] = await Promise.all([reviewsOf(b.id), listBusinesses(site.slug, { city: b.city_slug, category: b.category, limit: 7 })]);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const spot = isSpotlight(b);
  const rating = ratingOf(b);
  const url = `https://${site.domain}${bizHref(b)}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": cat?.schema || "LocalBusiness", name: b.name, url,
    ...(b.phone ? { telephone: b.phone } : {}),
    address: { "@type": "PostalAddress", ...(b.address ? { streetAddress: b.address } : {}), addressLocality: b.city, addressRegion: site.stateAbbr, ...(b.zip ? { postalCode: b.zip } : {}), addressCountry: "US" },
    ...(b.lat != null && b.lon != null ? { geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lon } } : {}),
    ...(b.photo_url ? { image: b.photo_url } : {}),
    ...(b.description ? { description: b.description } : {}),
    ...(b.hours ? { openingHours: b.hours } : {}),
    sameAs: [b.website, b.facebook, b.instagram].filter(Boolean),
    ...(b.rating_count > 0 && rating ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: b.rating_count, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map((r) => ({ "@type": "Review", reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 }, author: { "@type": "Person", name: r.name }, datePublished: String(r.created_at).slice(0, 10), reviewBody: r.body })),
    } : {}),
  };
  const mapUrl = b.lat != null && b.lon != null ? `https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lon}#map=17/${b.lat}/${b.lon}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${b.name} ${b.address || ""} ${b.city} ${site.stateAbbr}`)}`;
  const badge = `<a href="${url}" target="_blank" rel="noopener"><img src="https://${site.domain}/api/directory/badge?b=${b.slug}" alt="Featured on ${site.name}" width="200" height="64"></a>`;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-9 md:py-12">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [b.city, `/directory/${b.city_slug}`], [cat?.name || "Businesses", `/directory/${b.city_slug}/${b.category}`], [b.name, bizHref(b)]]} />
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
            {b.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.photo_url} alt={b.name} className="h-28 w-28 shrink-0 bg-white object-cover md:h-36 md:w-36" />
            )}
            <div>
              {spot && <span className="mb-2 inline-block px-2.5 py-1 text-[12px] font-black uppercase tracking-wider" style={{ background: acc }}>★ Featured business</span>}
              <h1 className="text-[32px] font-black leading-[1.05] md:text-[48px]">{b.name}</h1>
              <p className="mt-2 text-[16px] opacity-85">{cat?.icon} {cat?.name} · {b.city}, {site.state}{b.claimed ? " · ✓ Claimed by owner" : ""}</p>
              <div className="mt-2 [&_*]:!text-white"><Stars value={rating} count={b.rating_count} size={18} /></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {b.phone && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="px-5 py-3 text-[15px] font-black" style={{ background: acc }}>☎ Call {b.phone}</a>}
            {b.website && <a href={b.website} target="_blank" rel={spot ? "sponsored noopener" : "nofollow noopener"} className="bg-white px-5 py-3 text-[15px] font-black" style={{ color: ink }}>Visit website ›</a>}
            <a href={mapUrl} target="_blank" rel="noopener nofollow" className="border border-white/50 px-5 py-3 text-[15px] font-bold">Map &amp; directions</a>
            <a href="#review" className="border border-white/50 px-5 py-3 text-[15px] font-bold">★ Write a review</a>
          </div>
        </div>
      </section>
      <main className="mx-auto grid max-w-[1100px] gap-10 px-4 py-9 lg:grid-cols-[1fr_320px]">
        <div>
          {searchParams.reviewed && <p className="mb-6 bg-green-50 p-4 font-semibold text-green-800">Thanks! Check your email and click the link to publish your review.</p>}
          {searchParams.confirmed && <p className="mb-6 bg-green-50 p-4 font-semibold text-green-800">Your review is published. Thank you!</p>}
          {b.description && <section><h2 className="text-[22px] font-black">About {b.name}</h2><p className="mt-2 whitespace-pre-line text-[17px] leading-relaxed text-gray-800">{b.description}</p></section>}
          {b.article_slug && <p className="mt-4"><a href={`/${b.article_slug}`} className="font-bold underline" style={{ color: acc }}>Read the Business Spotlight profile ›</a></p>}
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
        </div>
        <aside className="space-y-5">
          <div className="bg-white p-5 shadow-sm">
            <h2 className="text-[17px] font-black">Contact &amp; hours</h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              {b.address && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Address</dt><dd>{b.address}, {b.city}, {site.stateAbbr} {b.zip || ""}</dd></div>}
              {b.phone && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Phone</dt><dd><a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="font-bold" style={{ color: acc }}>{b.phone}</a></dd></div>}
              {b.hours && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Hours</dt><dd className="whitespace-pre-line">{b.hours.replace(/;\s*/g, "\n")}</dd></div>}
              {(b.facebook || b.instagram) && <div><dt className="text-[12px] font-bold uppercase text-gray-500">Social</dt><dd className="flex gap-3">{b.facebook && <a href={b.facebook} target="_blank" rel="nofollow noopener" className="underline">Facebook</a>}{b.instagram && <a href={b.instagram} target="_blank" rel="nofollow noopener" className="underline">Instagram</a>}</dd></div>}
            </dl>
          </div>
          <div className="p-5 text-white" style={{ background: ink }}>
            <h2 className="text-[17px] font-black">{b.claimed ? "Is this your business?" : "Own this business?"}</h2>
            <p className="mt-1.5 text-[14.5px] opacity-90">{b.claimed ? "Update your details or get to the top of the list with Business Spotlight." : "Claim it free to correct the details, or get Business Spotlight: top of the list for 12 months plus a profile article."}</p>
            <a href={`/directory/join?b=${b.slug}`} className="mt-3 inline-block px-4 py-2.5 text-[14px] font-black" style={{ background: acc }}>{b.claimed ? "Update or upgrade ›" : "Claim this listing ›"}</a>
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
      {related.filter((x) => x.id !== b.id).length > 0 && (
        <section className="mx-auto max-w-[1100px] px-4 pb-10">
          <h2 className="text-[22px] font-black">More {cat?.name.toLowerCase()} in {b.city}</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">{related.filter((x) => x.id !== b.id).slice(0, 6).map((x) => <BizCard key={x.id} b={x} acc={acc} />)}</div>
          <p className="mt-4"><a href={`/directory/${b.city_slug}/${b.category}`} className="font-bold underline">All {cat?.name.toLowerCase()} in {b.city} ›</a></p>
          {b.source.startsWith("osm") && <OsmCredit />}
        </section>
      )}
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
