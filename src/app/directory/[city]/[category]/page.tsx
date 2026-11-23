import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { listBusinesses, categoryCounts, topCities, ratingOf, bizHref } from "@/lib/directory";
import { catBySlug, DIR_CATEGORIES } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit } from "@/components/directory/parts";

/**
 * "{Category} in {City}, {State}": the page people land on from searches like
 * "plumbers in Billings". Real listings only; indexed from 3 businesses up.
 */
export const dynamic = "force-dynamic";

async function load(city: string, category: string) {
  const site = siteFromHeaders();
  const cat = catBySlug(category);
  if (!cat) return null;
  const list = await listBusinesses(site.slug, { city, category, limit: 60 });
  if (!list.length) return { site, cat, list, cityName: null as string | null };
  return { site, cat, list, cityName: list[0].city };
}
const month = () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: { params: { city: string; category: string } }): Promise<Metadata> {
  const d = await load(params.city, params.category);
  if (!d?.cityName) return { robots: { index: false } };
  const n = d.list.length;
  return {
    title: `${d.cat.name} in ${d.cityName}, ${d.site.stateAbbr}: Phone, Hours & Reviews (${new Date().getFullYear()})`,
    description: `${n} ${d.cat.name.toLowerCase()} in ${d.cityName}, ${d.site.state} with phone numbers, addresses, hours, websites and reader reviews. Updated ${month()}.`,
    alternates: { canonical: `https://${d.site.domain}/directory/${params.city}/${params.category}` },
    robots: n >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function CityCategory({ params }: { params: { city: string; category: string } }) {
  const d = await load(params.city, params.category);
  if (!d?.cityName) notFound();
  const { site, cat, list, cityName } = d;
  const [counts, nearby] = await Promise.all([categoryCounts(site.slug, params.city), topCities(site.slug, 14, cat.slug)]);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const rated = list.filter((b) => b.rating_count > 0).sort((a, b) => (ratingOf(b) || 0) - (ratingOf(a) || 0));
  const withWeb = list.filter((b) => b.website).length, withPhone = list.filter((b) => b.phone).length;
  const faqs: Array<[string, string]> = [
    [`How many ${cat.name.toLowerCase()} are in ${cityName}?`, `The ${site.name} directory lists ${list.length} ${cat.name.toLowerCase()} in ${cityName}, ${site.state}; ${withPhone} have a phone number listed and ${withWeb} have a website.`],
    rated.length
      ? [`Which ${cat.name.toLowerCase()} in ${cityName} have the best reviews?`, `Based on reader reviews on ${site.name}: ${rated.slice(0, 3).map((b) => `${b.name} (${ratingOf(b)} stars, ${b.rating_count} review${b.rating_count === 1 ? "" : "s"})`).join("; ")}.`]
      : [`Are there reviews of ${cat.name.toLowerCase()} in ${cityName}?`, `Not yet. Readers can review any business on its page; reviews are published after the reviewer confirms their email.`],
    [`How do I add my business to this list?`, `Owners can add or claim a listing for free on ${site.name}. Business Spotlight puts a business at the top of the list for 12 months, with a profile article.`],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "ItemList", name: `${cat.name} in ${cityName}, ${site.state}`, numberOfItems: list.length,
      itemListElement: list.slice(0, 30).map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `https://${site.domain}${bizHref(b)}`, name: b.name })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const others = DIR_CATEGORIES.filter((c) => c.slug !== cat.slug && (counts[c.slug] || 0) > 0).slice(0, 18);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-9 md:py-12">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [cityName!, `/directory/${params.city}`], [cat.name, `/directory/${params.city}/${cat.slug}`]]} />
          <h1 className="mt-3 text-[32px] font-black leading-[1.05] md:text-[50px]"><span aria-hidden>{cat.icon} </span>{cat.name} in {cityName}, {site.state}</h1>
          <p className="mt-3 max-w-[760px] text-[17px] opacity-85">{list.length} local {list.length === 1 ? cat.one : cat.name.toLowerCase()} with phone numbers, addresses, hours and reader reviews. Updated {month()}.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-9">
        <div className="grid gap-5">{list.map((b) => <BizCard key={b.id} b={b} acc={acc} />)}</div>
        <aside className="mt-8 flex flex-col items-start justify-between gap-3 p-5 text-white sm:flex-row sm:items-center" style={{ background: ink }}>
          <p className="text-[16px]"><b>Are you a {cat.one} in {cityName}?</b> Claim your listing free, or get to the top with Business Spotlight.</p>
          <a href="/directory/join" className="shrink-0 px-5 py-2.5 font-black" style={{ background: acc }}>Add or claim ›</a>
        </aside>
        <section className="mt-10">
          <h2 className="text-[22px] font-black">Questions about {cat.name.toLowerCase()} in {cityName}</h2>
          <div className="mt-3 divide-y border-y bg-white">
            {faqs.map(([q, a]) => <details key={q} className="group p-4"><summary className="cursor-pointer text-[16.5px] font-bold">{q}</summary><p className="mt-2 text-[15.5px] text-gray-700">{a}</p></details>)}
          </div>
        </section>
        {others.length > 0 && (
          <section className="mt-10"><h2 className="text-[20px] font-black">More in {cityName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">{others.map((c) => <a key={c.slug} href={`/directory/${params.city}/${c.slug}`} className="border border-gray-300 bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-gray-900">{c.icon} {c.name}</a>)}</div>
          </section>
        )}
        {nearby.length > 1 && (
          <section className="mt-8"><h2 className="text-[20px] font-black">{cat.name} in other {site.state} towns</h2>
            <div className="mt-3 flex flex-wrap gap-2">{nearby.filter((c) => c.city_slug !== params.city).map((c) => <a key={c.city_slug} href={`/directory/${c.city_slug}/${cat.slug}`} className="border border-gray-300 bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-gray-900">{c.city} <span className="text-gray-500">{c.n}</span></a>)}</div>
          </section>
        )}
        <OsmCredit />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
