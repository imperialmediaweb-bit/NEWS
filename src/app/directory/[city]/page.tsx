import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { categoryCounts, listBusinesses, collapseChains, cityLeaders, bizHref } from "@/lib/directory";
import { DIR_CATEGORIES, DIR_GROUPS, catBySlug } from "@/lib/directory-categories";
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
  const [top, leaders] = await Promise.all([listBusinesses(site.slug, { city, limit: 8 }), cityLeaders(site.slug, city)]);
  return { site, counts, total, top, leaders, cityName: top[0]?.city || city };
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const d = await load(params.city);
  if (!d) return { robots: { index: false } };
  return {
    title: `${d.cityName} Business Guide ${new Date().getFullYear()}: Top-Rated Local Businesses | ${d.site.name}`,
    description: `${d.total} local businesses in ${d.cityName}, ${d.site.state}: restaurants, plumbers, dentists, auto repair, salons and more, with phone numbers, hours and reviews.`,
    alternates: { canonical: `https://${d.site.domain}/directory/${params.city}` },
    robots: d.total >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function CityDirectory({ params }: { params: { city: string } }) {
  const d = await load(params.city);
  if (!d) notFound();
  const { site, counts, total, top, leaders, cityName } = d;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-9 md:py-12">
          <Crumbs domain={site.domain} items={[["Directory", "/directory"], [cityName, `/directory/${params.city}`]]} />
          <h1 className="mt-3 text-[32px] font-black leading-[1.05] md:text-[50px]">{cityName} Business Guide {new Date().getFullYear()}</h1>
          <p className="mt-3 max-w-[760px] text-[17px] opacity-85">{total} local businesses in {cityName}, {site.state}, ranked by the Express Score: verified reader reviews, a complete profile and a confirmed owner. Nobody can pay to move up; paid placements are always labelled.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-9">
        {leaders.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[22px] font-black">Top-rated in {cityName}</h2>
            <p className="text-[14px] text-gray-600">The three highest Express Scores in each field. <a href="#how-ranked" className="underline">How we rank</a></p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {leaders.slice(0, 12).map((l) => {
                const c = catBySlug(l.category);
                return (
                  <div key={l.category} className="border border-gray-200 bg-white p-4">
                    <a href={`/directory/best/${params.city}/${l.category}`} className="text-[16px] font-black hover:underline"><span aria-hidden>{c?.icon} </span>Best {c?.name.toLowerCase()} in {cityName}</a>
                    <ol className="mt-2 space-y-1.5">
                      {l.top.map((b, i) => (
                        <li key={b.id} className="flex items-center justify-between gap-2 text-[14.5px]">
                          <a href={bizHref(b)} className="truncate hover:underline"><b>{i + 1}.</b> {b.name}</a>
                          <span className="shrink-0 rounded px-2 py-0.5 text-[12.5px] font-black text-white" style={{ background: acc }} title="Express Score">{b.express.total}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-[12.5px] text-gray-500">{l.count} {c?.name.toLowerCase()} ranked</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
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
        <div className="mt-4 grid gap-5 md:grid-cols-2">{collapseChains(top).map((b) => <BizCard key={b.id} b={b} acc={acc} />)}</div>
        <section id="how-ranked" className="mt-10 border-t pt-6 text-[14.5px] text-gray-700">
          <h2 className="text-[18px] font-black text-gray-900">How the Express Score works</h2>
          <p className="mt-2">Every business gets a score from 0 to 100, the same way: <b>reviews</b> up to 55 points (stars from readers who confirmed their email, and how many), <b>profile</b> up to 30 (hours, phone, website, description, photo) and <b>owner verified</b> 15 (the owner claimed the listing). Payment never changes the score; sponsored places are shown separately and marked &ldquo;Sponsored&rdquo;. Owners can raise their score for free by completing their profile and asking customers for reviews.</p>
        </section>
        <OsmCredit />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
