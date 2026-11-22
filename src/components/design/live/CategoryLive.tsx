import type { SiteConfig } from "@/config/site-config";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { serif, sans, TZ, href, hour, ago, liveVars, LiveTopBar, LiveFooter, LiveCompactHeader } from "./shared";
import MobileMenu from "./MobileMenu";
import CountySearch from "./CountySearch";
import AlertsBox from "./AlertsBox";

/**
 * "Live news" family, section page — built from the generated Texas category
 * mockup (21.11.2026): compact masthead with the section underlined, breaking
 * bar, a section banner, the top story beside the section's latest, a grid of
 * four with the latest headlines, a sub-section, the county finder, more
 * stories and pagination.
 */
const ABOUT: Record<string, (st: string) => string> = {
  politics: (st) => `Campaigns, the ${st} Legislature, state and local government, and the people and policies shaping ${st}.`,
  business: (st) => `Jobs, companies, energy and the economy across ${st} — who is hiring, building and investing.`,
  sports: (st) => `High school, college and pro sports from every corner of ${st}.`,
  opinion: (st) => `Editorials and columns on the issues facing ${st}.`,
  life: (st) => `Food, events, arts, travel and the stories of everyday life in ${st}.`,
  "local-news": (st) => `News from cities, towns and counties across ${st}.`,
};
const SUB: Record<string, [string, RegExp]> = {
  politics: ["Statehouse", /\b(legislat|senat|house|capitol|governor|lawmaker|bill)\b/i],
  business: ["Jobs & economy", /\b(jobs?|hiring|layoff|econom|wage|unemploy|plant|factory)\b/i],
  sports: ["High school sports", /\b(high school|isd|varsity|playoff|district)\b/i],
  life: ["Food & events", /\b(recipe|food|restaurant|festival|holiday|event|celebration|parade)\b/i],
  "local-news": ["Public safety", /\b(police|sheriff|arrest|fire|crash|court)\b/i],
};

type Item = HomeArticle;

export default function CategoryLive({
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
  stories: Item[];
  latestState: Item[];
  capital?: CityWeather;
  counties: string[];
  page: number;
  totalPages: number;
}) {
  const tz = TZ[site.state] || "America/New_York";
  const used = new Set<string>();
  const take = (list: Item[], n: number) => {
    const out: Item[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      if (!used.has(a.slug)) { used.add(a.slug); out.push(a); }
    }
    return out;
  };
  const lead = take(stories, 1)[0];
  const sideLatest = take(stories, 5);
  const grid = take(stories, 4);
  const headlines = take(stories, 7);
  const sub = SUB[slug];
  const subStories = sub ? take(stories.filter((a) => sub[1].test(a.title)), 4) : [];
  const rest = take(stories, 12);
  const breaking = latestState[0];
  const about = (ABOUT[slug] || ((st: string) => `${label} from across ${st}.`))(site.state);
  const popular = counties.length > 10 ? counties.filter((c) => ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin"].includes(c)) : counties.slice(0, 6);

  return (
    <div className={`${sans.className} min-h-screen bg-white text-[#1b2233]`} style={liveVars(site)}>
      <LiveTopBar site={site} capital={capital} />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <LiveCompactHeader site={site} active={slug} MobileMenu={MobileMenu} />

      {breaking && (
        <a href={href(breaking)} className="block bg-[#f1f2f6]">
          <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4">
            <span className="flex shrink-0 items-center bg-[var(--lv-acc)] py-2 pl-3 pr-6 text-[14px] font-extrabold uppercase tracking-wide text-white [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] md:py-2.5 md:pl-4 md:pr-7 md:text-[18px]">
              {breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000 ? "Breaking" : "Latest"}
            </span>
            <span className="truncate text-[14px] font-bold text-[#141b2d] md:text-[17px]">{breaking.title}</span>
            <span className="ml-auto hidden shrink-0 text-[13px] text-[#5a6275] sm:block">{hour(breaking, tz)}</span>
          </div>
        </a>
      )}

      {/* section banner */}
      <section className="relative overflow-hidden bg-[var(--lv-ink)] text-white">
        {lead && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lead.img} alt="" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-60 md:block" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--lv-ink)] via-[var(--lv-ink)] to-transparent md:via-[var(--lv-ink)]/90" />
        <div className="relative mx-auto flex max-w-[1240px] items-center gap-5 px-4 py-7 md:py-9">
          <span className="h-16 w-3 shrink-0 -skew-x-12 bg-[var(--lv-acc)] md:h-20" aria-hidden />
          <div>
            <h1 className={`${serif.className} text-[40px] font-extrabold leading-none md:text-[60px]`}>{label}</h1>
            <p className={`${serif.className} mt-2 max-w-[560px] text-[16px] italic text-white/85 md:text-[18px]`}>{about}</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1240px] px-4">
        {/* top story + section latest */}
        {lead && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <a href={href(lead)} className="group block">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lead.img} alt="" className="aspect-[16/9] w-full object-cover" />
                <span className="absolute left-0 top-4 bg-[var(--lv-acc)] px-3 py-1 text-[13px] font-extrabold uppercase text-white">Top story</span>
              </div>
              <h2 className={`${serif.className} mt-3 text-[30px] font-extrabold leading-[1.12] group-hover:text-[var(--lv-acc)] md:text-[38px]`}>{lead.title}</h2>
              {lead.summary && <p className="mt-2 text-[17px] text-[#3a4255]">{lead.summary}</p>}
              <p className="mt-2 text-[13px] text-[#6b7386]">By <b className="text-[#1b2233]">{lead.author.split(",")[0]}</b> · {ago(lead)}</p>
            </a>
            {sideLatest.length > 0 && (
              <aside className="h-fit border border-[#dde1ea] border-t-4 border-t-[var(--lv-acc)] bg-[#f6f7fb] p-4">
                <p className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--lv-acc)]">● Latest in {label}</p>
                <ol className="relative mt-3 border-l-2 border-[var(--lv-acc)]/30 pl-4">
                  {sideLatest.map((a) => (
                    <li key={a.slug} className="relative py-2">
                      <span className="absolute -left-[22px] top-3.5 h-2.5 w-2.5 rounded-full bg-[var(--lv-acc)]" />
                      <p className="text-[12px] font-bold text-[var(--lv-acc)]">{hour(a, tz)}</p>
                      <a href={href(a)} className={`${serif.className} text-[16px] font-semibold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </section>
        )}

        {/* grid of four + latest headlines */}
        {grid.length > 0 && (
          <section className="mt-8 grid gap-8 border-t border-[#e3e6ee] pt-6 lg:grid-cols-[1fr_340px]">
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
              {grid.map((a) => (
                <a key={a.slug} href={href(a)} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  <h3 className={`${serif.className} mt-2 text-[21px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</h3>
                  {a.summary && <p className="mt-1 line-clamp-2 text-[14px] text-[#4a5266]">{a.summary}</p>}
                  <p className="mt-1 text-[12px] text-[#6b7386]">By {a.author.split(",")[0]} · {ago(a)}</p>
                </a>
              ))}
            </div>
            {headlines.length > 0 && (
              <aside>
                <h2 className="flex items-center gap-2 border-b-2 border-[var(--lv-ink)] pb-2 text-[17px] font-extrabold uppercase text-[var(--lv-ink)]">Latest headlines</h2>
                <ul>
                  {headlines.map((a) => (
                    <li key={a.slug} className="flex gap-3 border-b border-[#e3e6ee] py-2.5">
                      <span className="w-16 shrink-0 text-[12px] font-bold text-[var(--lv-acc)]">{hour(a, tz)}</span>
                      <a href={href(a)} className="text-[14px] font-semibold leading-snug hover:text-[var(--lv-acc)]">{a.title}</a>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </section>
        )}

        {/* sub-section */}
        {sub && subStories.length >= 2 && (
          <section className="mt-10 border-y-2 border-[var(--lv-ink)] py-5">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <h2 className={`${serif.className} text-[30px] font-extrabold text-[var(--lv-ink)]`}>{sub[0]}</h2>
              <p className={`${serif.className} italic text-[#4a5266]`}>An inside look at {sub[0].toLowerCase()} in {site.state}.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
              <a href={href(subStories[0])} className="group block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={subStories[0].img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
              </a>
              <div>
                <a href={href(subStories[0])} className={`${serif.className} text-[26px] font-extrabold leading-tight hover:text-[var(--lv-acc)]`}>{subStories[0].title}</a>
                {subStories[0].summary && <p className="mt-2 text-[15px] text-[#4a5266]">{subStories[0].summary}</p>}
              </div>
              <ul>
                {subStories.slice(1).map((a) => (
                  <li key={a.slug} className="flex gap-2 border-b border-[#e3e6ee] py-2.5 text-[15px] font-bold"><span className="mt-1.5 h-2 w-2 shrink-0 bg-[var(--lv-acc)]" /><a href={href(a)} className="hover:text-[var(--lv-acc)]">{a.title}</a></li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* county finder */}
        {counties.length > 0 && (
          <section className="mt-8 grid gap-6 bg-[#f1f2f6] p-5 md:grid-cols-[1fr_1.4fr]">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/outline/${site.slug}.svg`} alt="" className="h-12 w-12 shrink-0" />
              <div>
                <h2 className={`${serif.className} text-[26px] font-bold text-[var(--lv-ink)]`}>Your county</h2>
                <p className="text-[14px] text-[#4a5266]">Find {label.toLowerCase()} coverage for your part of {site.state}.</p>
              </div>
            </div>
            <CountySearch state={site.state} counties={counties} popular={popular} />
          </section>
        )}

        {/* more stories */}
        {rest.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 border-b-2 border-[var(--lv-ink)] pb-2 text-[17px] font-extrabold uppercase text-[var(--lv-ink)]">More {label}</h2>
            <ul className="grid gap-x-8 md:grid-cols-2">
              {rest.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#e3e6ee] py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="h-20 w-28 shrink-0 object-cover" loading="lazy" />
                  <span>
                    <a href={href(a)} className={`${serif.className} text-[17px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                    <span className="mt-1 block text-[12px] text-[#6b7386]">{ago(a)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="border border-[#c9cfdc] px-3 py-2 text-[14px] font-bold text-[var(--lv-ink)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-10 w-10 items-center justify-center border text-[14px] font-bold ${n === page ? "border-[var(--lv-acc)] bg-[var(--lv-acc)] text-white" : "border-[#c9cfdc] text-[var(--lv-ink)]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="border border-[#c9cfdc] px-3 py-2 text-[14px] font-bold text-[var(--lv-ink)]">Next ›</a>}
          </nav>
        )}

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col items-start gap-3 bg-[var(--lv-acc)] p-6 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[20px] font-extrabold uppercase">Send us a tip</h2>
              <p className={`${serif.className} text-[16px] italic text-white/90`}>Know something about {label.toLowerCase()} in {site.state}? Tell our newsroom.</p>
            </div>
            <a href="/contact" className="shrink-0 bg-white px-5 py-2.5 text-[14px] font-bold uppercase text-[var(--lv-acc)] sm:ml-auto">Submit a tip →</a>
          </div>
          <AlertsBox name={site.name} state={site.state} />
        </section>
      </main>

      <LiveFooter site={site} />
    </div>
  );
}
