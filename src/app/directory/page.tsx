import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { categoryCounts, topCities, listBusinesses, dirSchema } from "@/lib/directory";
import { DIR_CATEGORIES, DIR_GROUPS } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { BizCard, OsmCredit } from "@/components/directory/parts";
import pool from "@/lib/db";

/** /directory: the state's business directory hub, search by service and town. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} Business Directory: Local Services, Restaurants & Shops`,
    description: `Find local businesses across ${site.state}: plumbers, electricians, restaurants, dentists, auto repair, salons and more, with phone numbers, hours and reader reviews. From ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/directory` },
  };
}

export default async function DirectoryHub({ searchParams }: { searchParams: { q?: string; where?: string } }) {
  const site = siteFromHeaders();
  await dirSchema();
  const [counts, cities, featured] = await Promise.all([categoryCounts(site.slug), topCities(site.slug, 36), listBusinesses(site.slug, { limit: 6 })]);
  const q = (searchParams.q || "").trim().slice(0, 80), where = (searchParams.where || "").trim().slice(0, 60);
  let results: Awaited<ReturnType<typeof listBusinesses>> = [];
  if (q) {
    const args: unknown[] = [site.slug, `%${q.toLowerCase()}%`];
    let extra = "";
    if (where) { args.push(`%${where.toLowerCase()}%`); extra = " AND lower(city) LIKE $3"; }
    const catHit = DIR_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.one.toLowerCase().includes(q.toLowerCase().replace(/s$/, ""))).map((c) => c.slug);
    args.push(catHit);
    const { rows } = await pool.query(`SELECT * FROM businesses WHERE site_slug = $1 AND status = 'active' AND (lower(name) LIKE $2 OR category = ANY($${args.length}::text[]))${extra}
      ORDER BY (tier <> 'free') DESC, rating_count DESC, name LIMIT 40`, args);
    results = rows;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1150px] px-4 py-10 md:py-14">
          <p className="text-[13px] font-black uppercase tracking-[.22em] opacity-80">{site.name} · Local directory</p>
          <h1 className="mt-2 text-[34px] font-black leading-[1.05] md:text-[56px]">Find local businesses in {site.state}</h1>
          <p className="mt-3 max-w-[720px] text-[17px] opacity-85">{total > 0 ? `${total.toLocaleString("en-US")} ${site.state} businesses` : `${site.state} businesses`}: phone numbers, addresses, hours and reviews from real readers.</p>
          <form action="/directory" className="mt-6 flex max-w-[820px] flex-col gap-2 sm:flex-row">
            <input name="q" defaultValue={q} placeholder="Plumber, pizza, dentist, business name…" className="min-w-0 flex-1 px-4 py-3.5 text-[16px] text-gray-900" aria-label="What are you looking for?" />
            <input name="where" defaultValue={where} placeholder="City or town" className="px-4 py-3.5 text-[16px] text-gray-900 sm:w-[220px]" aria-label="Where?" />
            <button className="px-6 py-3.5 text-[16px] font-black uppercase tracking-wider" style={{ background: acc }}>Search</button>
          </form>
          <a href="/directory/join" className="mt-5 inline-block border border-white/50 px-5 py-2.5 text-[14px] font-bold hover:bg-white/10">Own a business? Add or claim it free ›</a>
        </div>
      </section>
      <main className="mx-auto max-w-[1150px] px-4 py-10">
        {q && (
          <section className="mb-12">
            <h2 className="text-[24px] font-black">{results.length} result{results.length === 1 ? "" : "s"} for “{q}”{where ? ` in ${where}` : ""}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">{results.map((b) => <BizCard key={b.id} b={b} acc={acc} showCity />)}</div>
          </section>
        )}
        {DIR_GROUPS.map((g) => {
          const cats = DIR_CATEGORIES.filter((c) => c.group === g);
          return (
            <section key={g} className="mb-9">
              <h2 className="flex items-center gap-3 text-[22px] font-black"><span className="h-6 w-[5px]" style={{ background: acc }} />{g}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {cats.map((c) => (
                  <a key={c.slug} href={`/directory/category/${c.slug}`} className="group flex items-center gap-3 border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="text-[26px]" aria-hidden>{c.icon}</span>
                    <span><b className="block text-[14.5px] leading-tight group-hover:underline">{c.name}</b><span className="text-[12.5px] text-gray-500">{(counts[c.slug] || 0).toLocaleString("en-US")}</span></span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
        {cities.length > 0 && (
          <section className="mb-10">
            <h2 className="flex items-center gap-3 text-[22px] font-black"><span className="h-6 w-[5px]" style={{ background: acc }} />Browse by town</h2>
            <div className="mt-4 flex flex-wrap gap-2">{cities.map((c) => <a key={c.city_slug} href={`/directory/${c.city_slug}`} className="border border-gray-300 bg-white px-3 py-1.5 text-[14px] font-semibold hover:border-gray-900">{c.city} <span className="text-gray-500">{c.n}</span></a>)}</div>
          </section>
        )}
        {!q && featured.length > 0 && (
          <section>
            <h2 className="flex items-center gap-3 text-[22px] font-black"><span className="h-6 w-[5px]" style={{ background: acc }} />Featured businesses</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">{featured.map((b) => <BizCard key={b.id} b={b} acc={acc} showCity />)}</div>
          </section>
        )}
        <OsmCredit />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
