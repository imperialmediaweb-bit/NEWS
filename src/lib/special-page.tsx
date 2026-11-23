import type { SiteConfig } from "@/config/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { siteStories, storyHref } from "@/lib/related-stories";
import { TZ } from "@/config/timezones";
import { mockupOf } from "@/config/design-cfg";
import { artOf } from "@/config/state-art";
import { specialPagesFor } from "@/config/special-pages";
import PeachFx, { SplitWords } from "@/components/design/peach/PeachFx";
import { designFor } from "@/lib/design-nou";
import { serif as liveSerif, sans as liveSans } from "@/components/design/live/shared";
import { display as peachDisplay, body as peachBody } from "@/components/design/peach/shared";
import { cond as tabCond, text as tabText } from "@/components/design/tabloid/shared";
import { caslon, pub } from "@/components/design/broadsheet/shared";
import { crimson, nunito } from "@/components/design/coastal/shared";
import { spectral, mont } from "@/components/design/dark/shared";
import { zilla, lora } from "@/components/design/western/shared";
import { merri, mulish } from "@/components/design/gazette/shared";

/** The design family's own display and text faces, so a guide reads like its newspaper. */
const FONTS: Record<string, [string, string]> = {
  live: [liveSerif.className, liveSans.className],
  peach: [peachDisplay.className, peachBody.className],
  tabloid: [tabCond.className, tabText.className],
  magazine: [peachDisplay.className, peachBody.className],
  broadsheet: [caslon.className, pub.className],
  coastal: [crimson.className, nunito.className],
  dark: [spectral.className, mont.className],
  western: [zilla.className, lora.className],
  gazette: [merri.className, mulish.className],
};

/**
 * Shared frame for the state-only pages (hurricane tracker, football scores,
 * surf report…): the answer first, written from live data; the data; the
 * site's own stories; questions people search, with FAQPage structured data;
 * the source and the time it was updated. Built for Google and for AI answers.
 */
export type Faq = [string, string];

export async function SpecialPage({ site, path, h1, answer, children, storiesTitle, storiesPattern, faqs, source }: {
  site: SiteConfig;
  path: string;
  h1: string;
  answer: string;
  children?: React.ReactNode;
  storiesTitle: string;
  storiesPattern: string;
  faqs: Faq[];
  source: string;
}) {
  const stories = await siteStories(site.slug, storiesPattern, 30, 10);
  const tz = TZ[site.state] || "America/New_York";
  const updated = new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" });
  const url = `https://${site.domain}${path}`;
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: h1, url, dateModified: new Date().toISOString(), description: answer, publisher: { "@type": "NewsMediaOrganization", name: site.name, url: `https://${site.domain}` } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d";
  const acc = m?.acc || site.accent || "#b91c1c";
  const a = artOf(site.slug);
  const art = a.landscape || a.masthead || a.sky;
  const [displayFont, textFont] = FONTS[designFor(site.slug) || "live"] || FONTS.live;
  const others = specialPagesFor(site.stateAbbr).filter((p) => p !== path).slice(0, 8);
  const label = (p: string) => p.slice(1).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important}`}</style></noscript>
      <PeachFx />
      <Header site={site} />
      <div style={{ ["--sp-ink" as string]: ink, ["--sp-acc" as string]: acc } as React.CSSProperties} className={`${textFont} bg-[#f5f4f0] text-[#16181d]`}>
        <section className="relative overflow-hidden text-white" style={{ background: ink }}>
          {art && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${ink} 30%, transparent)` }} />
          <div className="relative mx-auto max-w-[1100px] px-4 py-12 md:py-16">
            <p className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[.24em] text-white/80"><span className="h-[3px] w-10" style={{ background: acc }} />{site.name} · {site.state} guide</p>
            <h1 className={`${displayFont} mt-4 max-w-[860px] text-[38px] font-black leading-[1.02] md:text-[62px]`}><SplitWords text={h1} /></h1>
            <p className="mt-4 flex flex-wrap items-center gap-3 text-[13.5px] text-white/80">
              <span className="inline-flex items-center gap-2 border border-white/25 px-3 py-1 font-bold uppercase tracking-wider"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34d399]" /></span>Live</span>
              <span>Updated {updated}</span><span className="opacity-70">· {source}</span>
            </p>
          </div>
        </section>
        <main className="mx-auto max-w-[1100px] px-4 pb-16">
          <div className="pc-in pc-up relative -mt-8 border-t-[6px] bg-white p-6 shadow-[0_18px_50px_-20px_rgba(0,0,0,.35)] md:p-9" style={{ borderColor: acc }}>
            <p className="text-[12px] font-black uppercase tracking-[.2em]" style={{ color: acc }}>The answer</p>
            <p className="mt-3 text-[20px] leading-[1.55] md:text-[23px]">{answer}</p>
          </div>
          {children && <div className="pc-in pc-up mt-10">{children}</div>}
          {stories.length > 0 && (
            <section className="pc-in pc-up mt-14">
              <h2 className={`${displayFont} flex items-center gap-3 text-[26px] font-black md:text-[32px]`}><span className="h-8 w-[6px]" style={{ background: acc }} />{storiesTitle}</h2>
              <div className="pc-stagger mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stories.slice(0, 9).map((a) => (
                  <a key={a.slug} href={storyHref(a)} className="pc-card group block border-b-2 border-transparent bg-white pb-4 transition hover:border-[var(--sp-acc)]">
                    <span className="pc-zoom block aspect-[16/10] overflow-hidden" style={{ background: ink }}>
                      {a.featured_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.featured_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </span>
                    <span className="block px-4 pt-3 text-[17px] font-bold leading-snug group-hover:text-[var(--sp-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <section className="pc-in pc-up mt-14">
            <h2 className={`${displayFont} flex items-center gap-3 text-[26px] font-black md:text-[32px]`}><span className="h-8 w-[6px]" style={{ background: acc }} />Questions people ask</h2>
            <div className="mt-5 border-t border-black/10">
              {faqs.map(([q, a]) => (
                <details key={q} className="group border-b border-black/10 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-bold">
                    {q}<span className="text-[26px] leading-none transition group-open:rotate-45" style={{ color: acc }} aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 max-w-[820px] text-[16px] leading-relaxed text-[#3b3f48]">{a}</p>
                </details>
              ))}
            </div>
          </section>
          {others.length > 0 && (
            <section className="pc-in pc-up mt-14 p-6 text-white md:p-8" style={{ background: ink }}>
              <p className="text-[12px] font-black uppercase tracking-[.2em] text-white/70">More {site.state} guides</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {[...others, "/alerts", "/gas-prices", "/things-to-do"].map((p) => (
                  <a key={p} href={p} className="border-b border-white/30 pb-0.5 text-[16px] font-bold hover:border-white">{label(p)} →</a>
                ))}
              </div>
            </section>
          )}
          <p className="mt-10 text-[14px] text-[#5b606b]">Know something we should add? <a href="/submit" className="font-bold underline">Tell the {site.name} newsroom</a>.</p>
        </main>
      </div>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}

export const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,.4)]">
    <table className="w-full text-left text-[15.5px]">
      <thead className="text-[12px] uppercase tracking-[.14em] text-white" style={{ background: "var(--sp-ink)" }}><tr>{head.map((h) => <th key={h} className="px-4 py-3.5 font-bold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-black/5 odd:bg-white even:bg-[#f8f7f3] hover:bg-[#fff8e6]">{r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? "font-bold" : ""}`}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);
