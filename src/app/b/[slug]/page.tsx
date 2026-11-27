import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getBizSite, isLive, videoEmbed } from "@/lib/business-site";
import { previewSig } from "@/lib/invite-sig";
import { ownerBusinesses } from "@/lib/directory-owner";
import { reviewsOf, ratingOf } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { parseHours, openNow, rangeText, DAY_NAMES } from "@/lib/opening-hours";
import { TZ } from "@/config/timezones";
import { mockupOf } from "@/config/design-cfg";
import AskBiz from "@/components/directory/AskBiz";
import SiteContact from "@/components/directory/SiteContact";
import BizTracker from "@/components/directory/BizTracker";

/**
 * A business's own one-page website on its paper (/b/{slug}). Live while the
 * subscription is paid; otherwise only the owner sees it (?t=token) as a
 * preview, marked as a draft and noindex. Three themes, the business's own
 * accent colour, hero photo, about, services with prices, gallery, hours with
 * a live open/closed badge, reviews, FAQ, the AI assistant and a contact form.
 */
export const dynamic = "force-dynamic";

async function load(slug: string, token?: string) {
  const site = siteFromHeaders();
  const s = await getBizSite(site.slug, slug);
  if (!s) return null;
  const live = isLive(s);
  let owner = false;
  if (!live && token) { const own = await ownerBusinesses(token, site.slug); owner = !!own?.businesses.some((b: { id: number }) => b.id === s.business_id); }
  // a signed preview link (from the invitation email) shows the draft to the business before it claims
  if (!live && !owner && token?.startsWith("pv_") && token.slice(3) === previewSig(s.business_id)) owner = true;
  if (!live && !owner) return null;
  return { site, s, live };
}

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: { t?: string } }): Promise<Metadata> {
  const d = await load(params.slug, searchParams.t);
  if (!d) return { robots: { index: false } };
  const b = d.s.business;
  return {
    title: `${b.name} · ${d.s.tagline || catBySlug(b.category)?.name} · ${b.city}, ${d.site.stateAbbr}`,
    description: (d.s.about || "").replace(/\s+/g, " ").slice(0, 160),
    alternates: { canonical: `https://${d.site.domain}/b/${params.slug}` },
    robots: d.live ? undefined : { index: false, follow: false },
    openGraph: d.s.hero_url ? { images: [d.s.hero_url] } : undefined,
  };
}

export default async function BusinessSite({ params, searchParams }: { params: { slug: string }; searchParams: { t?: string; live?: string } }) {
  const d = await load(params.slug, searchParams.t);
  if (!d) notFound();
  const { site, s, live } = d;
  const b = s.business;
  const m = mockupOf(site.slug);
  const acc = s.accent || m?.acc || site.accent || "#b91c1c";
  const ink = s.theme === "minimal" ? "#111111" : m?.ink || "#14213d";
  const reviews = await reviewsOf(b.id);
  const rating = ratingOf(b);
  const week = parseHours(b.hours);
  const status = week ? openNow(week, TZ[site.state] || "America/New_York") : null;
  const cat = catBySlug(b.category);
  const fullAddress = [b.address, b.city, site.stateAbbr].filter(Boolean).join(", ");
  const embed = b.lat != null && b.lon != null ? `https://www.openstreetmap.org/export/embed.html?bbox=${b.lon - 0.006}%2C${b.lat - 0.004}%2C${b.lon + 0.006}%2C${b.lat + 0.004}&layer=mapnik&marker=${b.lat}%2C${b.lon}` : null;
  const bold = s.theme === "bold", minimal = s.theme === "minimal";
  const ld = { "@context": "https://schema.org", "@type": cat?.schema || "LocalBusiness", name: b.name, url: `https://${site.domain}/b/${s.slug}`, description: s.about, ...(b.phone ? { telephone: b.phone } : {}), address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city, addressRegion: site.stateAbbr, addressCountry: "US" }, ...(s.hero_url ? { image: s.hero_url } : {}), ...(b.hours ? { openingHours: b.hours } : {}), ...(b.rating_count && rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount: b.rating_count } } : {}),
    makesOffer: s.services.map((x) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: x.name, description: x.desc }, ...(x.price ? { price: x.price.replace(/[^\d.]/g, "") || undefined, priceCurrency: "USD" } : {}) })) };
  const hid = new Set(Array.isArray(s.hidden) ? s.hidden : []);
  const show = (k: string) => !hid.has(k);
  const video = show("video") ? videoEmbed(s.video_url) : null;
  return (
    <div className={`bsite bsite-${s.theme}`} style={{ ["--acc" as string]: acc, ["--ink" as string]: ink } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {live && <BizTracker slug={b.slug} />}
      {!live && <div className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center text-[14px] font-black text-black">Preview: only you can see this page. <a href="/directory/owner" className="underline">Publish it from your dashboard</a> to make it live.</div>}
      {searchParams.live && live && <div className="bg-emerald-500 px-4 py-2 text-center text-[14px] font-black text-white">Your website is live! Share this link with your customers.</div>}

      {s.announcement && <div className="px-4 py-2 text-center text-[14.5px] font-black text-white" style={{ background: acc }}>{s.announcement}</div>}
      <header className="relative overflow-hidden text-white" style={{ background: ink }}>
        {s.hero_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.hero_url} alt="" className="bsite-hero absolute inset-0 h-full w-full object-cover" style={{ opacity: minimal ? 0.25 : 0.5 }} />
        )}
        <div className="absolute inset-0" style={{ background: bold ? `linear-gradient(135deg, ${acc}ee, ${ink}cc)` : `linear-gradient(180deg, ${ink}66, ${ink}ee)` }} />
        <nav className="relative mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 text-[14px] font-bold">
          <span className="flex items-center gap-3 text-[18px] font-black">{s.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo_url} alt={`${b.name} logo`} className="h-10 max-w-[140px] rounded bg-white/90 object-contain p-1" />
          )}{b.name}</span>
          <span className="hidden gap-6 md:flex">{show("services") && s.services.length > 0 && <a href="#services">Services</a>}{show("about") && <a href="#about">About</a>}{show("reviews") && <a href="#reviews">Reviews</a>}{show("contact") && <a href="#contact">Contact</a>}</span>
          {b.phone && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} data-track="call" className="rounded-full bg-white px-4 py-2 font-black" style={{ color: ink }}>☎ {b.phone}</a>}
        </nav>
        <div className={`relative mx-auto max-w-[1100px] px-5 ${bold ? "py-24 md:py-32" : "py-20 md:py-28"}`}>
          {status && <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold ring-1 ${status.open ? "bg-emerald-500/20 text-emerald-100 ring-emerald-300/50" : "bg-white/10 ring-white/25"}`}><span className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-400" : "bg-white/60"}`} />{status.label}</span>}
          <h1 className={`mt-4 max-w-[820px] font-black leading-[1.02] ${bold ? "text-[46px] uppercase md:text-[78px]" : minimal ? "font-serif text-[42px] md:text-[64px]" : "text-[42px] md:text-[68px]"}`}>{s.tagline || b.name}</h1>
          <p className="mt-4 text-[18px] opacity-90">{cat?.icon} {cat?.name} in {b.city}, {site.state}{rating ? ` · ★ ${rating.toFixed(1)} (${b.rating_count} reviews)` : ""}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="bsite-btn rounded-full px-7 py-3.5 text-[16px] font-black text-white shadow-lg" style={{ background: acc }}>{s.cta_label || "Contact us"}</a>
            {s.booking_url && <a href={s.booking_url} target="_blank" rel="noopener nofollow" data-track="website" className="bsite-btn rounded-full bg-white px-7 py-3.5 text-[16px] font-black" style={{ color: ink }}>📅 Book online</a>}
            {b.phone && <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} data-track="call" className="bsite-btn rounded-full bg-white px-7 py-3.5 text-[16px] font-black" style={{ color: ink }}>Call now</a>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5">
        {show("services") && s.services.length > 0 && (
          <section id="services" className="scroll-mt-20 py-16">
            <h2 className="bsite-h2">What we do</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {s.services.map((x, i) => (
                <div key={i} className="bsite-card rounded-2xl bg-white p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,.5)] ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3"><h3 className="text-[19px] font-black">{x.name}</h3>{x.price && <span className="shrink-0 rounded-full px-3 py-1 text-[14px] font-black text-white" style={{ background: acc }}>{x.price}</span>}</div>
                  {x.desc && <p className="mt-2 text-[15.5px] text-gray-600">{x.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {show("about") && <section id="about" className="scroll-mt-20 grid gap-10 py-14 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="bsite-h2">About {b.name}</h2>
            {(s.about || "").split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-4 text-[17.5px] leading-relaxed text-gray-700">{p}</p>)}
          </div>
          <div className="rounded-2xl p-6 text-white" style={{ background: ink }}>
            <h3 className="text-[18px] font-black">Visit us</h3>
            <p className="mt-2 text-[15.5px] opacity-90">{fullAddress}</p>
            {week && <table className="mt-4 w-full text-[14.5px]"><tbody>{DAY_NAMES.map((dname, i) => <tr key={dname} className={i === status?.today ? "font-black" : "opacity-85"}><td className="py-1">{dname}</td><td className="py-1 text-right">{rangeText(week[i])}</td></tr>)}</tbody></table>}
            {!week && b.hours && <p className="mt-3 text-[14.5px] opacity-90">{b.hours}</p>}
          </div>
        </section>}

        {show("gallery") && s.gallery.length > 0 && (
          <section className="py-10">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {s.gallery.map((u, i) => (
                <figure key={i} className="overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" loading="lazy" className="bsite-photo aspect-[4/3] w-full object-cover" /></figure>
              ))}
            </div>
          </section>
        )}

        {video && (
          <section className="py-10">
            <div className="aspect-video overflow-hidden rounded-2xl bg-black"><iframe src={video} title={`${b.name} video`} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" /></div>
          </section>
        )}

        {show("assistant") && <AskBiz slug={b.slug} name={b.name} acc={acc} hasHours={!!b.hours} hasReviews={b.rating_count > 0} />}

        {show("reviews") && <section id="reviews" className="scroll-mt-20 py-14">
          <h2 className="bsite-h2">What customers say</h2>
          {reviews.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">{reviews.slice(0, 8).map((r) => <blockquote key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><p className="text-amber-500">{"★".repeat(r.rating)}</p><p className="mt-1 text-[16px] text-gray-800">“{r.body}”</p><footer className="mt-2 text-[13px] font-bold text-gray-500">{r.name}</footer>{r.owner_reply && <p className="mt-2 text-[13.5px] text-gray-600"><b>Reply:</b> {r.owner_reply}</p>}</blockquote>)}</div>
          ) : <p className="mt-3 text-[16px] text-gray-600">Be the first to <a href={`/directory/listing/${b.slug}#review`} className="font-bold underline">leave a review</a>.</p>}
        </section>}

        {show("faqs") && s.faqs.length > 0 && (
          <section className="py-10">
            <h2 className="bsite-h2">Questions</h2>
            <div className="mt-5 divide-y rounded-2xl bg-white ring-1 ring-black/5">{s.faqs.map((f, i) => <details key={i} className="p-5"><summary className="cursor-pointer text-[17px] font-bold">{f.q}</summary><p className="mt-2 text-[16px] text-gray-700">{f.a}</p></details>)}</div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
          </section>
        )}

        {show("contact") && <section id="contact" className="scroll-mt-20 grid gap-8 py-14 md:grid-cols-2">
          <div>
            <h2 className="bsite-h2">Get in touch</h2>
            <p className="mt-3 text-[16.5px] text-gray-700">{b.phone ? <>Call <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} data-track="call" className="font-black" style={{ color: acc }}>{b.phone}</a> or send a message.</> : "Send a message and we'll get back to you."}</p>
            {embed && <iframe title={`Map of ${b.name}`} src={embed} loading="lazy" className="mt-5 h-[260px] w-full rounded-2xl border-0" />}
          </div>
          <SiteContact slug={s.slug} acc={acc} enabled={!!s.contact_email && live} />
        </section>}
      </main>
      <footer className="mt-10 py-8 text-center text-[13px] text-white/80" style={{ background: ink }}>
        © {new Date().getFullYear()} {b.name} · {fullAddress} · Website by <a href="/directory" className="underline">{site.name}</a>
      </footer>
      <style dangerouslySetInnerHTML={{ __html: `.bsite{background:#f6f5f2;color:#16181d;font-family:Inter,system-ui,sans-serif}.bsite-minimal{background:#fff}.bsite-h2{font-size:34px;font-weight:900;line-height:1.1}.bsite-bold .bsite-h2{text-transform:uppercase;letter-spacing:-.01em}.bsite-minimal .bsite-h2{font-family:Georgia,serif;font-weight:700}.bsite-h2:after{content:"";display:block;width:56px;height:5px;margin-top:10px;background:var(--acc);border-radius:3px}.bsite-hero{animation:bsZoom 24s ease-in-out infinite alternate}@keyframes bsZoom{from{transform:scale(1.03)}to{transform:scale(1.12)}}.bsite-btn,.bsite-card{transition:transform .25s ease,box-shadow .25s ease}.bsite-btn:hover{transform:translateY(-2px)}.bsite-card:hover{transform:translateY(-5px);box-shadow:0 26px 50px -28px rgba(0,0,0,.55)}.bsite-photo{transition:transform .7s ease}.bsite-photo:hover{transform:scale(1.06)}@media (prefers-reduced-motion:reduce){.bsite-hero,.bsite-photo,.bsite-card,.bsite-btn{animation:none;transition:none}}` }} />
    </div>
  );
}
