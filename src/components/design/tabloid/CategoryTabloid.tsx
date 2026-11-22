import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import { cond, text, tabVars, THead, Slant, TabTopBar, TabHeader, TabFooter } from "./shared";

/**
 * Florida section page — "tabloid" family: a giant italic section name on a
 * teal band with a gold rule, the lead story as a full-width poster with the
 * headline on a coral strip, a numbered list beside it, a grid, a Florida
 * sub-section (Tallahassee for politics, Gators and Noles for sports...),
 * county finder, headlines and pagination. Real stories only.
 */
const ABOUT_ORIG: Record<string, (st: string) => string> = {
  politics: () => "Tallahassee, the governor's office, Congress and the races shaping Florida.",
  business: () => "Tourism, ports, space, real estate, insurance and the companies building Florida.",
  sports: () => "Gators, Seminoles, Knights and Canes, the Dolphins, Bucs, Jaguars, Heat, Magic, Lightning and Panthers, and Friday nights statewide.",
  opinion: () => "Columns and editorials on the issues facing Florida.",
  life: () => "Beaches, food, festivals and everyday life from the Keys to the Panhandle.",
  "local-news": () => "News from every city and all 67 counties of Florida.",
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["Tallahassee", /\b(legislat|senat|house|capitol|governor|desantis|lawmaker|bill|tallahassee)\b/i],
  business: ["Tourism & jobs", /\b(tourism|tourist|hotel|cruise|jobs?|hiring|layoff|port|insurance|real estate)\b/i],
  sports: ["College football", /\b(gators|seminoles|fsu|ucf|knights|canes|football|bowl)\b/i],
  life: ["Beaches & outdoors", /\b(beach|park|springs|boat|fishing|manatee|festival|outdoor)\b/i],
  "local-news": ["Crime & courts", /\b(police|sheriff|arrest|court|crash|fire|shooting)\b/i],
};

export default function CategoryTabloid({
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
  // the descriptions and sub-sections written for Florida; any other state gets general ones
  const ABOUT = site.state === "Florida" ? ABOUT_ORIG : Object.fromEntries(Object.entries(genericAbout(site.state)).map(([k, v]) => [k, () => v]));
  const SUB = site.state === "Florida" ? SUB_ORIG : genericSub(site.state);
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
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--tb-ink)] to-[var(--tb-acc)]" />
    );

  return (
    <div className={`${text.className} ${cond.variable} min-h-screen overflow-x-hidden bg-white text-[#141414]`} style={tabVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <TabTopBar site={site} capital={capital} />
      <TabHeader site={site} MobileMenu={MobileMenu} active={slug} />

      <section className="border-b-[6px] border-[var(--tb-gold)] bg-[var(--tb-ink)] text-white">
        <div className={`${W} py-8 md:py-10`}>
          <nav aria-label="Breadcrumb" className="text-[13px] text-white/70"><a href="/" className="hover:text-white">Home</a> » {label}</nav>
          <h1 className={`${cond.className} text-[64px] font-black uppercase italic leading-[.9] md:text-[110px]`}>{label}</h1>
          <p className="mt-2 max-w-[760px] text-[16px] italic text-white/85 md:text-[18px]">{about}</p>
        </div>
      </section>

      <main className={W}>
        {lead && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <a href={href(lead)} className="group relative block min-h-[380px] overflow-hidden bg-[#111] md:min-h-[480px]">
              <span className="pc-zoom absolute inset-0"><Img a={lead} sizes="100vw" /></span>
              <span className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <span className={`${cond.className} inline bg-[var(--tb-acc)] box-decoration-clone px-2 text-[32px] font-black uppercase italic leading-[1.15] text-white md:text-[46px]`}>{lead.title}</span>
                <span className="mt-3 block text-[13px] text-white drop-shadow">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
              </span>
            </a>
            <ol className="pc-in pc-stagger">
              {nums.map((a, i) => (
                <li key={a.slug} className="border-b-2 border-[#111] py-3 first:pt-0">
                  <a href={href(a)} className="group flex gap-4">
                    <span className={`${cond.className} text-[60px] font-black italic leading-[.8] text-[var(--tb-acc)]`}>{i + 1}</span>
                    <span>
                      <span className={`${cond.className} block text-[23px] font-extrabold leading-[1.05] group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
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
            <THead>More {label.toLowerCase()}</THead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={a} /></span>
                  <span className={`${cond.className} mt-2 block text-[24px] font-extrabold leading-[1.05] group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
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
                    <span className={`${cond.className} mt-2 block text-[21px] font-extrabold leading-tight group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6">
            <div className="border border-[#d9d9d9] p-5">
              <THead>Your county</THead>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange", "Duval"]).filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <THead>{label} headlines</THead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e2e2e2] py-2.5">
                    <span className={`${cond.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--tb-acc)]`}>{hour(a, tz)}</span>
                    <span className="text-[15.5px] font-semibold leading-snug hover:text-[var(--tb-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div className="bg-[#111] p-6 text-white">
                <THead light>Latest in {site.state}</THead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-white/15 py-2.5 last:border-0">
                    <span className={`${cond.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--tb-gold)]`}>{hour(a, tz)}</span>
                    <span className="text-[15px] font-semibold leading-snug hover:text-[var(--tb-gold)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className={`${cond.className} border-2 border-[#111] px-3 py-1 text-[18px] font-bold italic`}>‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`${cond.className} flex h-10 w-10 items-center justify-center border-2 text-[18px] font-black italic ${n === page ? "border-[var(--tb-acc)] bg-[var(--tb-acc)] text-white" : "border-[#111]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className={`${cond.className} border-2 border-[#111] px-3 py-1 text-[18px] font-bold italic`}>Next ›</a>}
          </nav>
        )}
      </main>

      <TabFooter site={site} />
    </div>
  );
}
