import type { SiteConfig } from "@/config/site-config";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import { merri, mulish, gzVars, GHead, Slant, GzTopBar, GzHeader, GzFooter } from "./shared";

/**
 * Iowa section page — "community gazette" family (the tabloid layout set in gazette type and colour): a giant italic section name on a
 * teal band with a gold rule, the lead story as a full-width poster with the
 * headline on a gold strip, a numbered list beside it, a grid, an Iowa
 * sub-section (the Statehouse for politics, farm and ag for business...),
 * county finder, headlines and pagination. Real stories only.
 */
const ABOUT_ORIG: Record<string, (st: string) => string> = {
  politics: () => "The Statehouse, the governor, the caucuses and the races shaping Iowa.",
  business: () => "Farms, ag business, manufacturing, insurance and the companies of Iowa.",
  sports: () => "The Hawkeyes, the Cyclones, the Panthers, Drake, wrestling and Friday nights in every county.",
  opinion: () => "Columns and editorials on the questions facing Iowa.",
  life: () => "County fairs, food, faith and everyday life in every corner of Iowa.",
  "local-news": () => "News from all 99 counties of Iowa.",
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["At the Statehouse", /(legislat|senat|house|capitol|statehouse|governor|reynolds|lawmaker|bill|caucus)/i],
  business: ["Farm & ag", /(farm|corn|soy|hog|cattle|ag|ethanol|crop|harvest|deere)/i],
  sports: ["Hawkeyes & Cyclones", /(hawkeyes|cyclones|iowa state|uni|panthers|drake)/i],
  life: ["Fairs & festivals", /(fair|festival|church|parade|holiday|celebration|museum)/i],
  "local-news": ["Public safety", /(police|sheriff|arrest|court|crash|fire|shooting)/i],
};

export default function CategoryGazette({
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
  // the descriptions and sub-sections written for Iowa; any other state gets general ones
  const ABOUT = site.state === "Iowa" ? ABOUT_ORIG : Object.fromEntries(Object.entries(genericAbout(site.state)).map(([k, v]) => [k, () => v]));
  const SUB = site.state === "Iowa" ? SUB_ORIG : genericSub(site.state);
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
  const [lead, ...nums] = take(stories, 5);
  const grid = take(stories, 6);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 4) : [];
  const rest = take(stories, 12);
  const stateLatest = take(latestState, 8);
  const about = (ABOUT[slug] || (() => `The latest ${label.toLowerCase()} from across ${site.state}.`))(site.state);
  const W = "mx-auto max-w-[1360px] px-4";
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt={a.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--gz-ink)] to-[var(--gz-acc)]" />
    );

  return (
    <div className={`${mulish.className} ${merri.variable} min-h-screen overflow-x-hidden bg-[var(--gz-paper)] text-[#2b2414]`} style={gzVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <GzTopBar site={site} capital={capital} />
      <GzHeader site={site} MobileMenu={MobileMenu} active={slug} />

      <section className="border-b-[6px] border-[var(--gz-acc)] bg-[var(--gz-ink)] text-white">
        <div className={`${W} py-8 md:py-10`}>
          <nav aria-label="Breadcrumb" className="text-[13px] text-white/70"><a href="/" className="hover:text-white">Home</a> » {label}</nav>
          <h1 className={`${merri.className} text-[64px] font-black leading-[.9] md:text-[110px]`}>{label}</h1>
          <p className="mt-2 max-w-[760px] text-[16px] italic text-white/85 md:text-[18px]">{about}</p>
        </div>
      </section>

      <main className={W}>
        {lead && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <a href={href(lead)} className="group relative block min-h-[380px] overflow-hidden bg-[#111] md:min-h-[480px]">
              <span className="pc-zoom absolute inset-0"><Img a={lead} sizes="100vw" /></span>
              <span className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <span className={`${merri.className} inline bg-[var(--gz-acc)] box-decoration-clone px-2 text-[32px] font-black leading-[1.15] text-white md:text-[46px]`}>{lead.title}</span>
                <span className="mt-3 block text-[13px] text-white drop-shadow">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
              </span>
            </a>
            <ol className="pc-in pc-stagger">
              {nums.map((a, i) => (
                <li key={a.slug} className="border-b-2 border-[#111] py-3 first:pt-0">
                  <a href={href(a)} className="group flex gap-4">
                    <span className={`${merri.className} text-[60px] font-black leading-[.8] text-[var(--gz-acc)]`}>{i + 1}</span>
                    <span>
                      <span className={`${merri.className} block text-[23px] font-extrabold leading-[1.05] group-hover:text-[var(--gz-acc)]`}>{a.title}</span>
                      <span className="text-[12px] text-[#777]">{ago(a)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        <AdSlot position="top" className="mt-8" />

        {grid.length > 0 && (
          <section className="pc-in pc-up mt-10">
            <GHead>More {label.toLowerCase()}</GHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={a} /></span>
                  <span className={`${merri.className} mt-2 block text-[24px] font-extrabold leading-[1.05] group-hover:text-[var(--gz-acc)]`}>{a.title}</span>
                  {a.summary && <span className="mt-1 block line-clamp-2 text-[14px] italic text-[#555]">{a.summary}</span>}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="pc-in pc-up mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {subList.length > 0 ? (
            <div className="bg-[linear-gradient(120deg,#ffe3d6,#fff4d9)] p-6">
              <div className="mb-4"><Slant>{sub![0]}</Slant></div>
              <div className="grid gap-4 sm:grid-cols-2">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group block">
                    <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={a} /></span>
                    <span className={`${merri.className} mt-2 block text-[21px] font-extrabold leading-tight group-hover:text-[var(--gz-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6">
            <div className="border border-[#d9d9d9] p-5">
              <GHead>Your county</GHead>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Polk", "Linn", "Scott", "Johnson", "Black Hawk", "Story"]).filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <GHead>{label} headlines</GHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e2e2e2] py-2.5">
                    <span className={`${merri.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--gz-acc)]`}>{hour(a, tz)}</span>
                    <span className="text-[15.5px] font-semibold leading-snug hover:text-[var(--gz-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div className="bg-[#111] p-6 text-white">
                <GHead light>Latest in {site.state}</GHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-white/15 py-2.5 last:border-0">
                    <span className={`${merri.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--gz-acc)]`}>{hour(a, tz)}</span>
                    <span className="text-[15px] font-semibold leading-snug hover:text-[var(--gz-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className={`${merri.className} border-2 border-[#111] px-3 py-1 text-[18px] font-bold italic`}>‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`${merri.className} flex h-10 w-10 items-center justify-center border-2 text-[18px] font-black ${n === page ? "border-[var(--gz-acc)] bg-[var(--gz-acc)] text-white" : "border-[#111]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className={`${merri.className} border-2 border-[#111] px-3 py-1 text-[18px] font-bold italic`}>Next ›</a>}
          </nav>
        )}
      </main>

      <GzFooter site={site} />
    </div>
  );
}
