import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import { spectral, mont, dkOf, dkVars, DHead, DLabel, DkTopBar, DkHeader, DkFooter } from "./shared";

/**
 * Arizona section page — "dark premium" family: the section name large on
 * the dusk gradient, the lead as a cinematic panel, a dark grid, an Arizona
 * sub-section, county finder on parchment, headlines and pagination.
 */
const ABOUT_ORIG: Record<string, string> = {
  politics: "The Capitol, the governor, the border and the races shaping Arizona.",
  business: "Water, chips, housing, tourism and the companies building the desert economy.",
  sports: "Cardinals, Diamondbacks, Suns, Mercury, the Sun Devils, the Wildcats and Friday nights statewide.",
  opinion: "Columns and editorials on the questions facing Arizona.",
  life: "Food, culture, the outdoors and life under the desert sun.",
  "local-news": "News from Phoenix to Flagstaff, Tucson to Yuma, and all 15 counties.",
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["Border & water", /\b(border|migrant|immigra|water|colorado river|drought)\b/i],
  business: ["Chips & growth", /\b(tsmc|chip|semiconductor|plant|jobs?|housing|growth)\b/i],
  sports: ["Arizona teams", /\b(cardinals|diamondbacks|d-backs|suns|mercury|sun devils|wildcats)\b/i],
  life: ["Outdoors", /\b(grand canyon|hike|trail|park|lake|sedona|desert)\b/i],
  "local-news": ["Public safety", /\b(police|arrest|court|crash|fire|shooting)\b/i],
};

export default function CategoryDark({ site, slug, label, stories, latestState, capital, counties, page, totalPages }: {
  site: SiteConfig;
  slug: string;
  label: string;
  stories: HomeArticle[];
  latestState: HomeArticle[];
  capital?: CityWeather;
  counties: string[];
  page: number;
  totalPages: number;
}) {
  const d = dkOf(site);
  const tz = TZ[site.state] || "America/New_York";
  // the descriptions and sub-sections written for Arizona; any other state gets general ones
  const ABOUT = site.state === "Arizona" ? ABOUT_ORIG : genericAbout(site.state);
  const SUB = site.state === "Arizona" ? SUB_ORIG : genericSub(site.state);
  const used = new Set<string>();
  const take = (list: HomeArticle[], n: number) => {
    const out: HomeArticle[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      const t = a ? a.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : "";
      if (a && !used.has(a.slug) && !used.has(t)) {
        used.add(a.slug);
        used.add(t);
        out.push(a);
      }
    }
    return out;
  };
  const [lead] = take(stories, 1);
  const grid = take(stories, 6);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 3) : [];
  const rest = take(stories, 12);
  const stateLatest = take(latestState, 8);
  const W = "mx-auto max-w-[1340px] px-4";
  const light = { ["--lv-ink" as string]: d.deep, ["--lv-acc" as string]: d.acc } as React.CSSProperties;
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--dk-deep)] to-[#2a2220]" />
    );

  return (
    <div className={`${mont.className} ${spectral.variable} min-h-screen overflow-x-hidden bg-[var(--dk-bg)] text-[#e9ddd3]`} style={dkVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <DkTopBar site={site} capital={capital} />
      <DkHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      <section className={`${W} py-10`}>
        <p className="text-[12px] uppercase tracking-[.18em] text-white/45"><a href="/" className="hover:text-white">Home</a> / Section</p>
        <h1 className={`${spectral.className} mt-1 text-[56px] font-semibold leading-none text-white md:text-[88px]`}><SplitWords text={label} /></h1>
        <p className={`${spectral.className} mt-3 max-w-[760px] text-[19px] italic text-[#cdbfb4]`}>{ABOUT[slug] || `The latest ${label.toLowerCase()} from across ${site.state}.`}</p>
        <span className="mt-5 block h-[2px] w-28 bg-[var(--dk-cu)]" />
      </section>

      <main className={W}>
        {lead && (
          <a href={href(lead)} className="group relative block min-h-[420px] overflow-hidden border border-[var(--dk-cu)]/40">
            <span className="pc-zoom absolute inset-0"><Img a={lead} sizes="100vw" /></span>
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,14,.95),rgba(18,15,14,.4)_60%,transparent)]" />
            <span className="relative flex min-h-[420px] max-w-[640px] flex-col justify-center p-8">
              <DLabel>Top story</DLabel>
              <span className={`${spectral.className} block text-[34px] font-semibold leading-[1.08] text-white md:text-[46px]`}>{lead.title}</span>
              {lead.summary && <span className="mt-3 block text-[16px] text-white/75">{lead.summary}</span>}
              <span className="mt-3 block text-[13px] text-white/50">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
            </span>
          </a>
        )}

        <AdSlot position="top" className="mt-8" />

        {grid.length > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <a key={a.slug} href={href(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                <span className={`${spectral.className} mt-3 block text-[21px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
                <span className="text-[12px] text-white/45">{ago(a)}</span>
              </a>
            ))}
          </section>
        )}

        <section className="pc-in pc-up mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {subList.length > 0 ? (
            <div className="border border-[var(--dk-cu)]/30 bg-[var(--dk-panel)] p-6">
              <DHead>{sub![0]}</DHead>
              <div className="grid gap-5 sm:grid-cols-3">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group block">
                    <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={a} /></span>
                    <span className={`${spectral.className} mt-2 block text-[17px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-4 bg-[#f6efe9] p-4 text-[#2a1d17]" style={light}>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Maricopa", "Pima", "Pinal", "Yavapai", "Coconino", "Yuma"]).filter((c) => counties.includes(c))} />
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <DHead>{label} headlines</DHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-white/10 py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--dk-cu)]">{hour(a, tz)}</span>
                    <span className={`${spectral.className} text-[16.5px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div>
                <DHead>Latest in {site.state}</DHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-white/10 py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--dk-acc)]">{hour(a, tz)}</span>
                    <span className="text-[14.5px] font-semibold leading-snug hover:text-[var(--dk-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[15px]" aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="px-3 py-1 hover:text-[var(--dk-acc)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-10 w-10 items-center justify-center border ${n === page ? "border-[var(--dk-cu)] bg-[var(--dk-deep)] text-white" : "border-white/20 hover:border-[var(--dk-cu)]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="px-3 py-1 hover:text-[var(--dk-acc)]">Next ›</a>}
          </nav>
        )}
      </main>

      <DkFooter site={site} />
    </div>
  );
}
