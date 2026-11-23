import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ensurePaidTable, PRODUCTS } from "@/lib/paid";
import { LISTING_CATEGORIES } from "@/lib/listing-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

/** The paper's local business directory: paid, reviewed listings, labelled as paid. Noindex until it has 5 listings. */
export const dynamic = "force-dynamic";

type L = { id: number; business: string | null; title: string; body: string; website: string | null; phone: string | null; city: string | null; listing_category: string | null; photo_url: string | null };

async function listings(slug: string): Promise<L[]> {
  await ensurePaidTable();
  const { rows } = await pool.query(
    `SELECT id, business, title, body, website, phone, city, listing_category, photo_url FROM paid_orders
      WHERE site_slug = $1 AND product = 'listing' AND status = 'published' ORDER BY published_at DESC`,
    [slug]
  ).catch(() => ({ rows: [] as L[] }));
  return rows;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  const n = (await listings(site.slug)).length;
  return {
    title: `${site.state} Local Business Directory`,
    description: `Local businesses across ${site.state}: restaurants, home services, health, auto, legal and more, listed on ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/directory` },
    robots: n >= 5 ? undefined : { index: false, follow: true },
  };
}

export default async function DirectoryPage({ searchParams }: { searchParams: { c?: string } }) {
  const site = siteFromHeaders();
  const all = await listings(site.slug);
  const cat = LISTING_CATEGORIES.find((c) => c === searchParams.c) || null;
  const shown = cat ? all.filter((l) => l.listing_category === cat) : all;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const price = `$${(PRODUCTS.listing.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-10">
          <p className="text-[13px] font-black uppercase tracking-[.22em] opacity-80">{site.name}</p>
          <h1 className="mt-2 text-[36px] font-black leading-[1.05] md:text-[54px]">{site.state} business directory</h1>
          <p className="mt-3 max-w-[700px] text-[17px] opacity-85">Local businesses that serve {site.state} readers. Every listing is reviewed by our staff and paid for by the business.</p>
          <a href="/directory/join" className="mt-5 inline-block px-6 py-3 text-[15px] font-black uppercase tracking-wider" style={{ background: acc }}>List your business · {price}/month</a>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-10">
        <nav aria-label="Categories" className="flex flex-wrap gap-2">
          <a href="/directory" className="border px-3 py-1.5 text-[14px] font-semibold" style={!cat ? { background: ink, color: "#fff", borderColor: ink } : undefined}>All</a>
          {LISTING_CATEGORIES.map((c) => (
            <a key={c} href={`/directory?c=${encodeURIComponent(c)}`} className="border border-gray-300 px-3 py-1.5 text-[14px] font-semibold" style={cat === c ? { background: ink, color: "#fff", borderColor: ink } : undefined}>{c}</a>
          ))}
        </nav>
        {shown.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {shown.map((l) => (
              <article key={l.id} className="flex gap-4 bg-white p-5 shadow-[0_14px_40px_-26px_rgba(0,0,0,.5)]" style={{ borderTop: `4px solid ${acc}` }}>
                {l.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo_url} alt="" className="h-20 w-20 shrink-0 object-cover" loading="lazy" />
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">{l.listing_category} · {l.city} · <span title="This business paid to be listed">Paid listing</span></p>
                  <h2 className="mt-1 text-[20px] font-extrabold leading-snug">{l.business || l.title}</h2>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-gray-700">{l.body}</p>
                  <p className="mt-2 flex flex-wrap gap-4 text-[14px] font-bold">
                    {l.phone && <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} style={{ color: acc }}>☎ {l.phone}</a>}
                    {l.website && <a href={l.website} target="_blank" rel="sponsored noopener" style={{ color: acc }}>Website ›</a>}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 bg-white p-8 text-center shadow-sm">
            <p className="text-[20px] font-extrabold">{cat ? `No ${cat.toLowerCase()} listings yet.` : "The directory is just opening."}</p>
            <p className="mt-2 text-[16px] text-gray-600">Be one of the first {site.state} businesses listed on {site.name}.</p>
            <a href="/directory/join" className="mt-4 inline-block px-6 py-3 font-black text-white" style={{ background: acc }}>List your business</a>
          </div>
        )}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
