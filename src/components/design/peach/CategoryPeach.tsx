import type { SiteConfig } from "@/config/site-config";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "./PeachFx";
import { display, body, peachVars, PHead, Ico, PeachTopBar, PeachHeader, PeachFooter } from "./shared";

/**
 * Georgia section page — "peach" family: a deep-brown banner with the section
 * name arriving word by word, the top story large with three beside it, a
 * staggered grid, a Georgia sub-section (the Gold Dome for politics, college
 * football for sports...), the county finder and alerts, more headlines and
 * pagination. Built only from real stories; empty blocks are left out.
 */
const ABOUT_ORIG: Record<string, (st: string) => string> = {
  politics: (st) => `The Gold Dome, the governor, Congress and the local races shaping ${st}.`,
  business: (st) => `Jobs, ports, film, farms and the companies building ${st}'s economy.`,
  sports: (st) => `The Dawgs, the Yellow Jackets, the Braves, Falcons and Hawks, and Friday nights across ${st}.`,
  opinion: (st) => `Editorials and columns on the issues facing ${st}.`,
  life: (st) => `Food, festivals, the outdoors and everyday life from the mountains to the coast of ${st}.`,
  "local-news": (st) => `News from cities, towns and all 159 counties of ${st}.`,
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["Under the Gold Dome", /\b(legislat|general assembly|senat|house|capitol|governor|kemp|lawmaker|bill)\b/i],
  business: ["Jobs & economy", /\b(jobs?|hiring|layoff|econom|wage|unemploy|plant|factory|port)\b/i],
  sports: ["College football", /\b(bulldogs|uga|dawgs|georgia tech|yellow jackets|football|sec)\b/i],
  life: ["Food & festivals", /\b(recipe|food|restaurant|festival|holiday|event|celebration|parade|peach)\b/i],
  "local-news": ["Public safety", /\b(police|sheriff|arrest|fire|crash|court|gbi)\b/i],
};

export default function CategoryPeach({
  site,
  slug,
  label,
  stories,
  latestState,
  capital,
  counties,
  page,
  totalPages,
}: {
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
  const tz = TZ[site.state] || "America/New_York";
  // the descriptions and sub-sections written for Georgia; any other state gets general ones
  const ABOUT = site.state === "Georgia" ? ABOUT_ORIG : Object.fromEntries(Object.entries(genericAbout(site.state)).map(([k, v]) => [k, () => v]));
  const SUB = site.state === "Georgia" ? SUB_ORIG : genericSub(site.state);
  const used = new Set<string>();
  const take = (list: HomeArticle[], n: number) => {
    const out: HomeArticle[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      // the same story is sometimes filed twice under two addresses
      const t = a ? a.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : "";
      if (a && !used.has(a.slug) && !used.has(t)) {
        used.add(a.slug);
        used.add(t);
        out.push(a);
      }
    }
    return out;
  };
  const [lead, ...side] = take(stories, 4);
  const grid = take(stories, 6);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 4) : [];
  const rest = take(stories, 12);
  const sideLatest = take(latestState, 4);
  const stateLatest = take(latestState, 8);
  const about = (ABOUT[slug] || ((st: string) => `The latest ${label.toLowerCase()} from across ${st}.`))(site.state);
  const W = "mx-auto max-w-[1360px] px-4";
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt={a.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--pc-acc)]/40 to-[var(--pc-cu)]/50" />
    );

  return (
    <div className={`${body.className} ${display.variable} min-h-screen overflow-x-hidden bg-[var(--pc-paper)] text-[#2b1d17]`} style={peachVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <PeachTopBar site={site} capital={capital} />
      <PeachHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      {/* banner */}
      <section className="pc-footer relative overflow-hidden bg-[var(--pc-ink)] text-white">
        <div className={`${W} relative py-10 md:py-14`}>
          <nav aria-label="Breadcrumb" className="text-[13px] text-white/70"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">›</span> {label}</nav>
          <h1 className={`${display.className} mt-2 text-[44px] font-black leading-none md:text-[76px]`}><SplitWords text={label} /></h1>
          <p className="mt-3 max-w-[680px] text-[16px] text-white/80 md:text-[18px]">{about}</p>
          <span className="mt-5 block h-[3px] w-24 bg-[var(--pc-acc)]" />
        </div>
      </section>

      <main className={W}>
        {/* top story + three */}
        {lead && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <a href={href(lead)} className="pc-card group block">
              <span className="pc-zoom block aspect-[16/9] overflow-hidden rounded-md"><Img a={lead} sizes="100vw" /></span>
              <span className={`${display.className} mt-4 block text-[30px] font-extrabold leading-tight text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)] md:text-[38px]`}>{lead.title}</span>
              {lead.summary && <span className="mt-2 block line-clamp-3 text-[16px] text-[#5a4a42]">{lead.summary}</span>}
              <span className="mt-2 block text-[13px] text-[#8a7a72]">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
            </a>
            {side.length > 0 && (
              <div className="pc-in pc-stagger space-y-4">
                {side.map((a) => (
                  <a key={a.slug} href={href(a)} className="pc-card pc-spot group flex gap-4 rounded-md bg-white p-3">
                    <span className="pc-zoom h-24 w-32 shrink-0 overflow-hidden rounded-sm"><Img a={a} /></span>
                    <span>
                      <span className={`${display.className} block text-[18px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{a.title}</span>
                      <span className="mt-1 block text-[12px] text-[#8a7a72]">{ago(a)}</span>
                    </span>
                  </a>
                ))}
                {sideLatest.length > 0 && (
                  <div className="rounded-md bg-[var(--pc-ink)] p-5 text-white">
                    <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[.06em] text-[var(--pc-acc)]"><span className="pc-dot" aria-hidden /> Now in {site.state}</p>
                    {sideLatest.map((a) => (
                      <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/15 py-2 first:border-0">
                        <span className="w-14 shrink-0 pt-0.5 text-[12px] font-bold text-[#ffc4ad]">{hour(a, tz)}</span>
                        <span className="text-[14.5px] font-semibold leading-snug hover:text-[#ffc4ad]">{a.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* grid */}
        {grid.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <PHead icon={Ico.brief}>More {label.toLowerCase()}</PHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card pc-spot group block rounded-md bg-white p-3">
                  <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden rounded-sm"><Img a={a} /></span>
                  <span className={`${display.className} mt-3 block text-[20px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{a.title}</span>
                  {a.summary && <span className="mt-1 block line-clamp-2 text-[14px] text-[#5a4a42]">{a.summary}</span>}
                  <span className="mt-2 block text-[12px] text-[#8a7a72]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Georgia sub-section + county */}
        <section className="pc-in pc-up mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {subList.length > 0 ? (
            <div className="rounded-md bg-[linear-gradient(135deg,#f7dccf,#fbeee6)] p-6">
              <PHead icon={Ico.dome}>{sub![0]}</PHead>
              <div className="grid gap-4 sm:grid-cols-2">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group block">
                    <span className="pc-zoom block aspect-[16/10] overflow-hidden rounded-sm"><Img a={a} /></span>
                    <span className={`${display.className} mt-2 block text-[17px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6">
            <div className="rounded-md border border-[var(--pc-cu)]/30 bg-white p-5">
              <PHead icon={Ico.pin}>Your county</PHead>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Fulton", "Gwinnett", "Cobb", "DeKalb", "Chatham", "Richmond"]).filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {/* headlines: this section and the state */}
        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <PHead icon={Ico.flame}>{label} headlines</PHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[var(--pc-cu)]/20 py-3">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                    <span className="text-[15.5px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div className="rounded-md bg-[var(--pc-ink)] p-6 text-white">
                <PHead icon={Ico.leaf} light>Latest in {site.state}</PHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-white/15 py-2.5 last:border-0">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[var(--pc-acc)]">{hour(a, tz)}</span>
                    <span className="text-[15px] font-semibold leading-snug hover:text-[#ffc4ad]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="rounded-sm border border-[var(--pc-cu)]/50 px-3 py-2 text-[14px] font-bold text-[var(--pc-ink)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-10 w-10 items-center justify-center rounded-sm border text-[14px] font-bold ${n === page ? "border-[var(--pc-acc)] bg-[var(--pc-acc)] text-white" : "border-[var(--pc-cu)]/50 text-[var(--pc-ink)]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="rounded-sm border border-[var(--pc-cu)]/50 px-3 py-2 text-[14px] font-bold text-[var(--pc-ink)]">Next ›</a>}
          </nav>
        )}
      </main>

      <PeachFooter site={site} />
    </div>
  );
}
