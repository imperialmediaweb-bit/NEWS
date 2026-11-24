import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { liveDeals } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

/** Local deals and coupons in the state, from businesses in the directory. */
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  const n = (await liveDeals(site.slug, { limit: 10 }).catch(() => [])).length;
  return { title: `${site.state} Deals and Coupons From Local Businesses`, description: `Current deals and coupons from ${site.state} businesses, on ${site.name}.`, alternates: { canonical: `https://${site.domain}/directory/deals` }, robots: n >= 3 ? undefined : { index: false, follow: true } };
}

export default async function Deals() {
  const site = siteFromHeaders();
  const deals = await liveDeals(site.slug).catch(() => []);
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-10">
          <h1 className="text-[34px] font-black md:text-[50px]">🏷 {site.state} deals &amp; coupons</h1>
          <p className="mt-2 text-[17px] opacity-85">Offers from local businesses in the {site.name} directory. Check the details with the business before you go.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-9">
        {deals.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {deals.map((d) => (
              <article key={d.id} className="rounded-xl border-2 border-dashed bg-white p-5" style={{ borderColor: acc }}>
                <p className="text-[12px] font-black uppercase tracking-[.16em] text-gray-500">{catBySlug(d.category)?.icon} {d.city} · until {new Date(d.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</p>
                <h2 className="mt-1 text-[22px] font-black">{d.title}</h2>
                <p className="mt-0.5 font-bold"><a href={`/directory/listing/${d.biz_slug}`} className="underline">{d.biz_name}</a></p>
                {d.details && <p className="mt-2 text-[15px] text-gray-700">{d.details}</p>}
                {d.code && <p className="mt-3 inline-block rounded border-2 border-dashed px-3 py-1 font-mono text-[16px] font-bold" style={{ borderColor: acc }}>{d.code}</p>}
              </article>
            ))}
          </div>
        ) : <p className="text-[17px]">No deals right now. Own a business? Open your listing in the <a href="/directory" className="font-bold underline">directory</a> and post one.</p>}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
