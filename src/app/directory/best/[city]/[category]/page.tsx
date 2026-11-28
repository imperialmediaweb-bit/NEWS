import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { bizHref, ratingOf, isSpotlight, rank } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { Crumbs, OsmCredit, Stars } from "@/components/directory/parts";

/**
 * "Best {category} in {town} ({Month Year})": a ranking computed from data,
 * never paid for: verified reader reviews (weighted so one 5-star review
 * doesn't beat ten 4-star ones), then how complete and current the listing
 * is (hours, phone, website, description, claimed by the owner). Spotlight
 * does NOT change the order here; the method is printed on the page.
 */
export const dynamic = "force-dynamic";

const month = () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: { params: { city: string; category: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const cat = catBySlug(params.category);
  if (!cat) return {};
  const list = await rank(site.slug, params.city, params.category);
  const town = list[0]?.city;
  if (!town) return { robots: { index: false } };
  return {
    title: `Best ${cat.name} in ${town}, ${site.stateAbbr} (${month()}): Top ${list.length}`,
    description: `The top ${list.length} ${cat.name.toLowerCase()} in ${town}, ${site.state}, ranked by verified reader reviews and complete, current listings. Phone numbers, hours and addresses. Updated ${month()}.`,
    alternates: { canonical: `https://${site.domain}/directory/best/${params.city}/${params.category}` },
    robots: list.length >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function Best({ params }: { params: { city: string; category: string } }) {
  const site = siteFromHeaders();
  const cat = catBySlug(params.category);
  if (!cat) notFound();
  const list = await rank(site.slug, params.city, params.category);
  if (!list.length) notFound();
  const town = list[0].city;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const url = `https://${site.domain}/directory/best/${params.city}/${params.category}`;
  const ld = { "@context": "https://schema.org", "@type": "ItemList", name: `Best ${cat.name} in ${town}, ${site.state}`, itemListOrder: "https://schema.org/ItemListOrderDescending", numberOfItems: list.length, url,
    itemListElement: list.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `https://${site.domain}${bizHref(b)}`, name: b.name })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1000px] px-4 py-10">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [town, `/directory/${params.city}`], [cat.name, `/directory/${params.city}/${cat.slug}`], ["Best", `/directory/best/${params.city}/${cat.slug}`]]} />
          <p className="mt-4 text-[13px] font-black uppercase tracking-[.22em]" style={{ color: acc }}>{month()} ranking</p>
          <h1 className="mt-1 text-[32px] font-black leading-[1.05] md:text-[52px]">{cat.icon} Best {cat.name.toLowerCase()} in {town}</h1>
          <p className="mt-3 max-w-[720px] text-[17px] opacity-85">The top {list.length} {cat.name.toLowerCase()} in {town}, {site.state}, ranked from verified reader reviews and how complete and current each listing is. Nobody can pay to be on this list.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1000px] px-4 py-9">
        <ol className="space-y-4">
          {list.map((b, i) => (
            <li key={b.id} className="best-row flex gap-4 bg-white p-4 shadow-sm md:p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[20px] font-black text-white" style={{ background: i < 3 ? acc : ink }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-extrabold leading-snug"><a href={bizHref(b)} className="hover:underline">{b.name}</a>{isSpotlight(b) && <span className="ml-2 align-middle text-[11px] font-black uppercase tracking-wider" style={{ color: acc }}>Featured</span>}</h2>
                <p className="text-[13.5px] text-gray-500">{[b.address, b.city].filter(Boolean).join(", ")}</p>
                <div className="mt-1"><Stars value={ratingOf(b)} count={b.rating_count} /></div>
                {b.description && <p className="mt-1.5 line-clamp-2 text-[14.5px] text-gray-700">{b.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="rounded bg-gray-900 px-2 py-0.5 font-black text-white" title="Express Score, 0-100">Express Score {b.express.total}</span>
                  {b.express.parts.map((p) => <span key={p.label} className="rounded border border-gray-300 px-2 py-0.5 text-gray-600">{p.label}: {p.points}/{p.max}</span>)}
                </div>
                <p className="mt-2 flex flex-wrap gap-4 text-[14px] font-bold">
                  {b.phone && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} style={{ color: acc }}>☎ {b.phone}</a>}
                  <a href={bizHref(b)} className="text-gray-700">Hours, map &amp; reviews ›</a>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <section className="mt-10 bg-white p-5 shadow-sm">
          <h2 className="text-[18px] font-black">How we rank</h2>
          <p className="mt-2 text-[15px] text-gray-700">Each business gets a score from verified reader reviews (weighted, so a single 5-star review doesn&apos;t outrank many good ones) plus points for a complete, current listing: opening hours, phone, website, a description and a verified owner. Paid placement does not change this ranking. The list updates every time a review is published. Own one of these businesses? <a href="/directory/join" className="font-bold underline">Claim your listing free</a> and ask your customers for honest reviews.</p>
        </section>
        <p className="mt-6"><a href={`/directory/${params.city}/${cat.slug}`} className="font-bold underline">All {cat.name.toLowerCase()} in {town} ›</a></p>
        <OsmCredit />
      </main>
      <style dangerouslySetInnerHTML={{ __html: `.best-row{transition:transform .2s ease,box-shadow .2s ease}.best-row:hover{transform:translateX(4px);box-shadow:0 14px 30px -18px rgba(0,0,0,.45)}` }} />
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
