import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { topCities, listBusinesses } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit } from "@/components/directory/parts";

/** "{Category} in {State}": the towns that have them, plus the top listings statewide. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { cat: string } }): Promise<Metadata> {
  const site = siteFromHeaders();
  const cat = catBySlug(params.cat);
  if (!cat) return {};
  const cities = await topCities(site.slug, 200, cat.slug);
  const n = cities.reduce((a, c) => a + c.n, 0);
  return {
    title: `${cat.name} in ${site.state}: Find One Near You`,
    description: `${n} ${cat.name.toLowerCase()} across ${site.state}, town by town, with phone numbers, hours and reader reviews. From ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/directory/category/${cat.slug}` },
    robots: n >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function StateCategory({ params }: { params: { cat: string } }) {
  const site = siteFromHeaders();
  const cat = catBySlug(params.cat);
  if (!cat) notFound();
  const [cities, top] = await Promise.all([topCities(site.slug, 200, cat.slug), listBusinesses(site.slug, { category: cat.slug, limit: 12 })]);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-9 md:py-12">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [cat.name, `/directory/category/${cat.slug}`]]} />
          <h1 className="mt-3 text-[32px] font-black leading-[1.05] md:text-[50px]"><span aria-hidden>{cat.icon} </span>{cat.name} in {site.state}</h1>
          <p className="mt-3 text-[17px] opacity-85">Choose a town to see every {cat.one} there.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-9">
        {cities.length ? (
          <div className="flex flex-wrap gap-2">{cities.map((c) => <a key={c.city_slug} href={`/directory/${c.city_slug}/${cat.slug}`} className="border border-gray-300 bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-gray-900">{cat.name} in {c.city} <span className="text-gray-500">{c.n}</span></a>)}</div>
        ) : <p className="text-[17px]">No {cat.name.toLowerCase()} listed yet. <a href="/directory/join" className="font-bold underline">Add yours free</a>.</p>}
        {top.length > 0 && <><h2 className="mt-10 text-[22px] font-black">Featured {cat.name.toLowerCase()}</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{top.map((b) => <BizCard key={b.id} b={b} acc={acc} showCity />)}</div></>}
        <OsmCredit />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
