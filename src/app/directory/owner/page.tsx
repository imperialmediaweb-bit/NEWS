import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { ownerBusinesses, ownerStats } from "@/lib/directory-owner";
import { rank, isSpotlight } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { OwnerLogin, ReplyBox } from "@/components/directory/OwnerTools";

/**
 * Owner dashboard (sign-in by emailed link): for each listing the email has
 * claimed, the last 30 days (views, calls, website and directions clicks,
 * where readers came from: Google, Bing, ChatGPT...), its position in the
 * town's top 10 with the badge to embed, reviews with AI-drafted replies,
 * and links to post a deal, print the QR sign or get Business Spotlight.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Business dashboard", robots: { index: false, follow: false } };

export default async function Owner({ searchParams }: { searchParams: { t?: string } }) {
  const site = siteFromHeaders();
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const own = searchParams.t ? await ownerBusinesses(searchParams.t, site.slug) : null;
  if (!own) {
    return (
      <>
        <Header site={site} />
        <main className="mx-auto max-w-[620px] px-4 py-14">
          <h1 className="text-[32px] font-black">Your business dashboard</h1>
          <p className="mt-2 text-[16.5px] text-gray-700">See how many people viewed your page, called you or visited your website, and where they found you (Google, Bing, ChatGPT). Reply to reviews with one click. Enter the email you used to claim your listing and we&apos;ll send you a sign-in link.</p>
          {searchParams.t && <p className="mt-4 bg-amber-50 p-3 font-semibold text-amber-800">That link has expired. Ask for a new one below.</p>}
          <OwnerLogin acc={acc} />
          <p className="mt-6 text-[14px] text-gray-500">Not listed yet? <a href="/directory/join" className="underline">Add or claim your business free</a>.</p>
        </main>
        <Footer site={site} about={generateContent(site).footerAbout} />
      </>
    );
  }
  const items = await Promise.all(own.businesses.map(async (b: Record<string, never>) => {
    const [stats, ranking, { rows: reviews }] = await Promise.all([
      ownerStats(b.id as number),
      rank(site.slug, b.city_slug, b.category).catch(() => []),
      pool.query(`SELECT id, rating, body, name, owner_reply, created_at FROM business_reviews WHERE business_id = $1 AND verified AND NOT hidden ORDER BY created_at DESC LIMIT 30`, [b.id]),
    ]);
    const pos = ranking.findIndex((r) => r.name.toLowerCase() === String(b.name).toLowerCase());
    return { b, stats, pos: ranking.length >= 5 ? pos : -1, reviews };
  }));
  const tile = (label: string, n: number | undefined, icon: string) => (
    <div className="bg-white p-4 shadow-sm"><p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">{icon} {label}</p><p className="mt-1 text-[30px] font-black">{n || 0}</p></div>
  );
  return (
    <>
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1000px] px-4 py-9">
          <p className="text-[13px] font-black uppercase tracking-[.2em] opacity-80">Business dashboard · last 30 days</p>
          <h1 className="mt-1 text-[30px] font-black md:text-[42px]">Hello, {own.email}</h1>
        </div>
      </section>
      <main className="mx-auto max-w-[1000px] space-y-12 px-4 py-9">
        {items.length === 0 && <p>No claimed listings for this email on {site.name}.</p>}
        {items.map(({ b, stats, pos, reviews }) => {
          const cat = catBySlug(b.category as string);
          const badgeUrl = `https://${site.domain}/api/directory/top10?b=${b.slug}`;
          const pageUrl = `https://${site.domain}/directory/listing/${b.slug}`;
          return (
            <section key={b.id as number}>
              <h2 className="text-[26px] font-black"><a href={`/directory/listing/${b.slug}`} className="hover:underline">{b.name}</a></h2>
              <p className="text-[14px] text-gray-500">{cat?.icon} {cat?.name} · {b.city}{isSpotlight(b as never) ? " · ★ Business Spotlight" : ""}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {tile("Page views", stats.view, "👀")}{tile("Calls", stats.call, "☎")}{tile("Website visits", stats.website, "🔗")}{tile("Directions", stats.directions, "🧭")}
              </div>
              <div className="mt-3 bg-white p-4 shadow-sm">
                <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Where people found you</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
                  {[["Google", stats.from_google], ["Bing / Yahoo / DuckDuckGo", stats.from_bing], ["ChatGPT", stats.from_chatgpt], ["Perplexity", stats.from_perplexity], ["Social media", stats.from_social], ["Your QR sign", stats.from_qr], ["Other sites", stats.from_other]].map(([l, n]) => <span key={l as string}><b>{(n as number) || 0}</b> {l}</span>)}
                </div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-[1fr_260px]">
                <div>
                  <h3 className="text-[19px] font-black">Reviews ({reviews.length})</h3>
                  {reviews.length ? reviews.map((r: { id: number; rating: number; body: string; name: string; owner_reply: string | null }) => (
                    <div key={r.id} className="mt-3 border-l-4 bg-white p-4" style={{ borderColor: acc }}>
                      <p className="text-amber-500">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span> <span className="text-[13px] text-gray-500">{r.name}</span></p>
                      <p className="mt-1 text-[15px]">{r.body}</p>
                      <ReplyBox token={searchParams.t!} reviewId={r.id} current={r.owner_reply} acc={acc} />
                    </div>
                  )) : <p className="mt-2 text-[15px] text-gray-600">No reviews yet. Print your free QR sign and ask happy customers to scan it.</p>}
                </div>
                <aside className="space-y-3">
                  {pos >= 0 ? (
                    <div className="bg-white p-4 text-center shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/directory/top10?b=${b.slug}`} alt="Top 10 badge" className="mx-auto h-36 w-36" />
                      <p className="mt-2 text-[14px] font-bold">You&apos;re #{pos + 1} in {b.city}!</p>
                      <textarea readOnly value={`<a href="${pageUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Top 10 ${cat?.name || ""} in ${b.city}" width="160" height="160"></a>`} className="mt-2 h-20 w-full border p-2 font-mono text-[10.5px]" aria-label="Badge code for your website" />
                      <p className="text-[12px] text-gray-500">Paste this on your website.</p>
                    </div>
                  ) : <div className="bg-white p-4 text-[14px] shadow-sm">Not in your town&apos;s top 10 yet. Reviews, hours, a description and photos move you up.</div>}
                  <a href={`/api/directory/qr?b=${b.slug}&format=sign`} target="_blank" rel="noopener" className="block bg-white p-4 text-[14px] font-bold shadow-sm hover:underline">🖨 Print your “Review us” QR sign</a>
                  <a href={`/directory/deal?b=${b.slug}`} className="block bg-white p-4 text-[14px] font-bold shadow-sm hover:underline">🏷 Post a deal ($19)</a>
                  <a href={`/directory/join?b=${b.slug}`} className="block p-4 text-[14px] font-black text-white" style={{ background: acc }}>★ Business Spotlight ($49): top of your town for 12 months</a>
                </aside>
              </div>
            </section>
          );
        })}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
