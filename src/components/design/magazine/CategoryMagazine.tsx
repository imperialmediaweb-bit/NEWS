import type { SiteConfig } from "@/config/site-config";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import { serifM, sansM, magVars, MHead, Label, MagTopBar, MagHeader, MagFooter } from "./shared";

/**
 * California section page — "magazine" family: a quiet centred title in
 * italic serif with a one-line description, the top story as a cover (photo
 * left, headline right), an editorial grid, a California sub-section
 * (Sacramento for politics, Silicon Valley for business...), the county
 * finder, headlines and pagination. Real stories only.
 */
const ABOUT_ORIG: Record<string, string> = {
  politics: "Sacramento, the governor, Congress and the local races shaping California.",
  business: "Tech, entertainment, agriculture, housing and the companies building California's economy.",
  sports: "The Dodgers, Giants, Lakers, Warriors, Rams, 49ers and the college and high school teams across the state.",
  opinion: "Columns and editorials on the questions facing California.",
  life: "Food, culture, the outdoors and everyday life from the coast to the Sierra.",
  "local-news": "News from every city and all 58 counties of California.",
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["Sacramento", /\b(legislat|senat|assembly|capitol|governor|newsom|lawmaker|bill|sacramento)\b/i],
  business: ["Silicon Valley & tech", /\b(tech|ai|startup|silicon|apple|google|meta|nvidia|software|chip)\b/i],
  sports: ["Pro teams", /\b(dodgers|giants|angels|padres|lakers|clippers|warriors|kings|49ers|niners|rams|chargers)\b/i],
  life: ["Outdoors", /\b(park|beach|hike|trail|yosemite|tahoe|ski|camp|ocean)\b/i],
  "local-news": ["Public safety", /\b(police|sheriff|arrest|court|crash|fire|shooting|chp)\b/i],
};

export default function CategoryMagazine({
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
  // the descriptions and sub-sections written for California; any other state gets general ones
  const ABOUT = site.state === "California" ? ABOUT_ORIG : genericAbout(site.state);
  const SUB = site.state === "California" ? SUB_ORIG : genericSub(site.state);
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
  const [lead] = take(stories, 1);
  const grid = take(stories, 6);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 3) : [];
  const rest = take(stories, 12);
  const stateLatest = take(latestState, 8);
  const W = "mx-auto max-w-[1320px] px-4";
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt={a.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--mg-ink)] to-[var(--mg-acc)]" />
    );

  return (
    <div className={`${sansM.className} ${serifM.variable} min-h-screen overflow-x-hidden bg-white text-[#222]`} style={magVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <MagTopBar site={site} capital={capital} />
      <MagHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      <section className="mx-auto max-w-[860px] px-4 py-10 text-center md:py-14">
        <p className="text-[13px] uppercase tracking-[.2em] text-[#999]"><a href="/" className="hover:text-[var(--mg-acc)]">Home</a> · Section</p>
        <h1 className={`${serifM.className} mt-2 text-[56px] font-semibold italic leading-none text-[var(--mg-ink)] md:text-[84px]`}><SplitWords text={label} /></h1>
        <p className={`${serifM.className} mt-4 text-[19px] text-[#555]`}>{ABOUT[slug] || `The latest ${label.toLowerCase()} from across ${site.state}.`}</p>
        <span className="mx-auto mt-6 block h-px w-24 bg-[var(--mg-gold)]" />
      </section>

      <main className={W}>
        {lead && (
          <a href={href(lead)} className="group grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <span className="pc-clip pc-in pc-zoom block aspect-[3/2] overflow-hidden"><Img a={lead} sizes="100vw" /></span>
            <span>
              <Label>Top story</Label>
              <span className={`${serifM.className} block text-[34px] font-semibold leading-[1.08] group-hover:text-[var(--mg-acc)] md:text-[46px]`}>{lead.title}</span>
              {lead.summary && <span className="mt-4 block text-[17px] leading-relaxed text-[#555]">{lead.summary}</span>}
              <span className="mt-3 block text-[14px] text-[#888]">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
            </span>
          </a>
        )}

        <AdSlot position="top" className="mt-10" />

        {grid.length > 0 && (
          <section className="pc-in pc-stagger mt-14 grid gap-x-8 gap-y-10 border-t border-[#e6ddcc] pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <a key={a.slug} href={href(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                <span className={`${serifM.className} mt-3 block text-[22px] font-semibold leading-snug group-hover:text-[var(--mg-acc)]`}>{a.title}</span>
                {a.summary && <span className="mt-1 block line-clamp-2 text-[15px] text-[#666]">{a.summary}</span>}
                <span className="mt-1 block text-[12px] text-[#999]">{ago(a)}</span>
              </a>
            ))}
          </section>
        )}

        <section className="pc-in pc-up mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {subList.length > 0 ? (
            <div className="bg-[#f7f2e8] p-6">
              <MHead>{sub![0]}</MHead>
              <div className="grid gap-6 sm:grid-cols-3">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group block">
                    <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={a} /></span>
                    <span className={`${serifM.className} mt-2 block text-[18px] font-semibold leading-snug group-hover:text-[var(--mg-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6">
            <div>
              <MHead>Your county</MHead>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Los Angeles", "San Diego", "Orange", "Santa Clara", "Alameda", "Sacramento"]).filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-14 grid gap-12 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <MHead>{label} headlines</MHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#eee] py-3">
                    <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[#999]">{hour(a, tz)}</span>
                    <span className={`${serifM.className} text-[17px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div>
                <MHead>Latest in {site.state}</MHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#eee] py-3">
                    <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[var(--mg-acc)]">{hour(a, tz)}</span>
                    <span className="text-[15.5px] font-semibold leading-snug hover:text-[var(--mg-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className={`${serifM.className} mt-12 flex flex-wrap items-center justify-center gap-3 text-[18px]`} aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="px-2 italic hover:text-[var(--mg-acc)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-10 w-10 items-center justify-center rounded-full ${n === page ? "bg-[var(--mg-ink)] text-white" : "hover:bg-[#f3ede1]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="px-2 italic hover:text-[var(--mg-acc)]">Next ›</a>}
          </nav>
        )}
      </main>

      <MagFooter site={site} />
    </div>
  );
}
