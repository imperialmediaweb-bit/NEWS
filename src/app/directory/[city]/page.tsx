import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { categoryCounts, listBusinesses, collapseChains, cityLeaders, categoryPhoto, cityPhoto } from "@/lib/directory";
import { DIR_CATEGORIES, DIR_GROUPS } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, Crumbs, OsmCredit } from "@/components/directory/parts";
import { CityHero, LeaderBoards, HowRanked } from "@/components/directory/CityGuide";
import pool from "@/lib/db";

/** "Local businesses in {City}": every category with listings in that town. */
export const dynamic = "force-dynamic";

async function load(city: string) {
  const site = siteFromHeaders();
  const counts = await categoryCounts(site.slug, city);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const [top, leaders, { rows: v }] = await Promise.all([
    listBusinesses(site.slug, { city, limit: 8 }), cityLeaders(site.slug, city),
    pool.query(`SELECT COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND city_slug = $2 AND status = 'active' AND claimed`, [site.slug, city]).catch(() => ({ rows: [{ n: 0 }] })),
  ]);
  const cityName = top[0]?.city || city;
  const [photo, ...catPhotos] = await Promise.all([
    cityPhoto(site.slug, city, cityName, site.state).catch(() => null),
    ...leaders.slice(0, 12).map((l) => categoryPhoto(l.category).catch(() => null)),
  ]);
  const photos = Object.fromEntries(leaders.slice(0, 12).map((l, i) => [l.category, catPhotos[i]?.url || null]));
  return { site, counts, total, top, leaders, verified: v[0]?.n || 0, cityName, photo: photo?.url || null, photos };
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
  const { site, counts, total, top, leaders, verified, cityName, photo, photos } = d;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { "@context": "https://schema.org", "@type": "CollectionPage", name: `${cityName} Business Guide`, url: `https://${site.domain}/directory/${params.city}`, about: { "@type": "City", name: cityName, containedInPlace: { "@type": "State", name: site.state } },
          hasPart: leaders.slice(0, 12).map((l) => ({ "@type": "ItemList", name: `Best ${DIR_CATEGORIES.find((c) => c.slug === l.category)?.name.toLowerCase() || l.category} in ${cityName}`, url: `https://${site.domain}/directory/best/${params.city}/${l.category}`,
            itemListElement: l.top.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, url: `https://${site.domain}/directory/listing/${b.slug}` })) })) },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
          { "@type": "Question", name: `How are businesses in ${cityName} ranked?`, acceptedAnswer: { "@type": "Answer", text: `By the Express Score from 0 to 100: verified reader reviews up to 55 points, a complete profile up to 30 and a verified owner 15. Payment never changes the score; sponsored places are labelled.` } },
          { "@type": "Question", name: `How many local businesses are listed in ${cityName}?`, acceptedAnswer: { "@type": "Answer", text: `${total.toLocaleString("en-US")} businesses in ${cityName}, ${site.state}, across ${Object.keys(counts).length} fields.` } },
          { "@type": "Question", name: `How do I get quotes from local businesses in ${cityName}?`, acceptedAnswer: { "@type": "Answer", text: `Open the field you need (for example plumbers) in the ${cityName} guide and describe the job once; up to 3 local businesses receive it and contact you. It is free.` } },
        ] },
      ]) }} />
      <CityHero city={cityName} state={site.state} total={total} ranked={leaders.length} verified={verified} ink={ink} acc={acc} photo={photo}
        popular={leaders.slice(0, 6).map((l) => { const c = DIR_CATEGORIES.find((x) => x.slug === l.category); return { slug: l.category, name: c?.name || l.category, icon: c?.icon || "" }; })}
        crumbs={<Crumbs domain={site.domain} items={[["Directory", "/directory"], [cityName, `/directory/${params.city}`]]} />} />
      <div className="bg-[#f6f5f1]">
        <LeaderBoards leaders={leaders} city={cityName} citySlug={params.city} acc={acc} photos={photos} />
        <section className="mx-auto max-w-[1160px] px-4 pb-12">
          <p className="text-[12.5px] font-black uppercase tracking-[.2em]" style={{ color: acc }}>Explore {cityName}</p>
          <h2 className="mt-1 font-serif text-[28px] font-black md:text-[36px]">Every field, every business</h2>
          <div className="mt-6 space-y-6">
            {DIR_GROUPS.map((g) => {
              const cats = DIR_CATEGORIES.filter((c) => c.group === g && counts[c.slug]);
              if (!cats.length) return null;
              return (
                <div key={g}>
                  <h3 className="text-[13px] font-black uppercase tracking-wider text-gray-500">{g}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cats.map((c) => (
                      <a key={c.slug} href={`/directory/${params.city}/${c.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[14.5px] font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
                        <span aria-hidden>{c.icon}</span>{c.name}<span className="rounded-full bg-gray-100 px-2 text-[12px] font-bold text-gray-600">{counts[c.slug]}</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="mx-auto max-w-[1160px] px-4 pb-12">
          <h2 className="font-serif text-[26px] font-black md:text-[32px]">Featured in {cityName}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">{collapseChains(top).map((b) => <BizCard key={b.id} b={b} acc={acc} />)}</div>
        </section>
        <section className="mx-auto max-w-[1160px] px-4 pb-12">
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl p-6 text-white md:flex-row md:items-center md:p-8" style={{ background: `linear-gradient(120deg, ${acc}, ${ink})` }}>
            <div><p className="font-serif text-[24px] font-black md:text-[30px]">Own a business in {cityName}?</p><p className="mt-1 text-[16px] text-white/85">Claim your listing free, see your place in the city and get a website built for you.</p></div>
            <a href="/directory/join" className="shrink-0 rounded-full bg-white px-6 py-3 text-[15px] font-black text-gray-900 shadow-lg transition hover:-translate-y-0.5">Claim it free ›</a>
          </div>
        </section>
        <HowRanked acc={acc} />
        <div className="mx-auto max-w-[1160px] px-4 pb-10"><OsmCredit /></div>
      </div>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
