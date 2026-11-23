import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { categoryCounts, listBusinesses } from "@/lib/directory";
import { DIR_CATEGORIES, DIR_GROUPS } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit } from "@/components/directory/parts";

/** "Local businesses in {City}": every category with listings in that town. */
export const dynamic = "force-dynamic";

async function load(city: string) {
  const site = siteFromHeaders();
  const counts = await categoryCounts(site.slug, city);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const top = await listBusinesses(site.slug, { city, limit: 8 });
  return { site, counts, total, top, cityName: top[0]?.city || city };
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const d = await load(params.city);
  if (!d) return { robots: { index: false } };
  return {
    title: `${d.cityName}, ${d.site.stateAbbr} Business Directory: Restaurants, Services & Shops`,
    description: `${d.total} local businesses in ${d.cityName}, ${d.site.state}: restaurants, plumbers, dentists, auto repair, salons and more, with phone numbers, hours and reviews.`,
    alternates: { canonical: `https://${d.site.domain}/directory/${params.city}` },
    robots: d.total >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function CityDirectory({ params }: { params: { city: string } }) {
  const d = await load(params.city);
  if (!d) notFound();
  const { site, counts, total, top, cityName } = d;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-9 md:py-12">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [cityName, `/directory/${params.city}`]]} />
          <h1 className="mt-3 text-[32px] font-black leading-[1.05] md:text-[50px]">Local businesses in {cityName}, {site.state}</h1>
          <p className="mt-3 text-[17px] opacity-85">{total} businesses in {cityName}, by category.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-9">
        {DIR_GROUPS.map((g) => {
          const cats = DIR_CATEGORIES.filter((c) => c.group === g && counts[c.slug]);
          if (!cats.length) return null;
          return (
            <section key={g} className="mb-8">
              <h2 className="text-[20px] font-black">{g}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {cats.map((c) => (
                  <a key={c.slug} href={`/directory/${params.city}/${c.slug}`} className="flex items-center gap-3 border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="text-[24px]" aria-hidden>{c.icon}</span>
                    <span><b className="block text-[14.5px] leading-tight">{c.name} in {cityName}</b><span className="text-[12.5px] text-gray-500">{counts[c.slug]}</span></span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
        <h2 className="mt-4 text-[20px] font-black">Featured in {cityName}</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">{top.map((b) => <BizCard key={b.id} b={b} acc={acc} />)}</div>
        <OsmCredit />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
