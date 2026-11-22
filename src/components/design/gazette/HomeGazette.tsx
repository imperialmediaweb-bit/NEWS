import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, StateOutline, Drought } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE, srcSetOf } from "../live/shared";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, sportsReOf } from "@/config/state-data";
import { citiesOf } from "@/lib/local-data";
import Extras from "../extras/Extras";
import StateMap from "../StateMap";
import { merri, mulish, gzOf, gzVars, GHead, GzTopBar, GzHeader, GzFooter } from "./shared";

/**
 * Iowa homepage — "community gazette" family, from the generated Iowa mockup
 * (21.11.2026): logo with the slogan and the menu on one line, a gold
 * breaking tag, the Imperial slider with the lead headline below it beside
 * Today in brief; the state's own module — tornado and severe weather alerts
 * (NWS) with drought across the state by intensity (U.S. Drought Monitor) —
 * the county finder with A–Z, weather across Iowa, gas and airports;
 * politics, business, sports; opinion; County by county (stories grouped by
 * the county they name); the shared premium sections; life, safety / schools
 * / most read, lottery, latest, more, tip and alerts.
 */

const SPORTS_IA = /\b(game|coach|football|basketball|wrestling|volleyball|baseball|playoff|season|team|athlet|hawkeyes|cyclones|panthers|drake|bulldogs|tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|trooper|jail|prison)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|district)\b/i;
const DROUGHT: Array<[keyof Drought, string, string]> = [["d0", "Abnormally dry", "#ffff00"], ["d1", "Moderate drought", "#fcd37f"], ["d2", "Severe drought", "#ffaa00"], ["d3", "Extreme drought", "#e60000"], ["d4", "Exceptional drought", "#730000"]];

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[#efe3c4] to-[#d9c79d]" />
  );

export default function HomeGazette({
  site,
  articles,
  weather,
  counties,
  sections,
  alerts,
  gas,
  lottery,
  airports,
  outline,
  drought,
}: {
  site: SiteConfig;
  articles: HomeArticles;
  weather: CityWeather[];
  storms?: unknown;
  counties: string[];
  sections?: Record<string, HomeArticle[]>;
  alerts?: WeatherAlert[] | null;
  gas?: GasPrices | null;
  lottery?: LotteryDraw[] | null;
  airports?: AirportStatus[] | null;
  launches?: unknown;
  quakes?: unknown;
  fires?: unknown;
  outline?: StateOutline | null;
  subway?: unknown;
  volcanoes?: unknown;
  buoys?: unknown;
  uv?: unknown;
  snow?: unknown;
  drought?: Drought | null;
}) {
  const g = gzOf(site);
  const tz = TZ[site.state] || "America/Chicago";
  const lead = articles.heroMain!;
  const used = new Set<string>([lead.slug, lead.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()]);
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
  const pool = articles.pool || articles.latestPosts;
  const heroSlides = take(articles.heroSide.concat(articles.trending), 5).map((a) => ({ id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) }));
  const brief = take(articles.latestPosts.concat(pool), 5);
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 3);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", sportsReOf(site.state, SPORTS_IA), 3);
  const opinion = take(articles.opinion, 3);
  const life = sec("life", TOPIC_RE.life, 4);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((x) => x.city === g.capital) || weather[0];
  // county by county: the counties named in the week's stories
  const byCounty: Array<[string, HomeArticle[]]> = [];
  for (const c of counties) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} County\\b`, "i");
    const list = pool.filter((a) => re.test(a.title) || re.test(a.summary || "")).slice(0, 3);
    if (list.length) byCounty.push([c, list]);
  }
  byCounty.sort((a, b) => b[1].length - a[1].length);
  const counties6 = byCounty.slice(0, 6);
  const letters = Array.from(new Set(counties.map((c) => c[0].toUpperCase()))).sort();
  const severe = (alerts || []).filter((a) => /tornado|severe|thunderstorm|blizzard|winter storm|ice|flood/i.test(a.event));
  const W = "mx-auto max-w-[1340px] px-4";
  const H = `${merri.className} font-bold leading-[1.15] text-[#231a08]`;
  const card = "pc-spot rounded-md border border-[#e3d3ad] bg-white";

  return (
    <div className={`${mulish.className} ${merri.variable} min-h-screen overflow-x-hidden bg-[var(--gz-paper)] text-[#2b2414]`} style={gzVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <GzTopBar site={site} capital={capital} />
      <GzHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-4`}>
        <a href={href(breaking)} className="group flex items-center gap-4 border border-[#e3d3ad] bg-white">
          <span className="shrink-0 bg-[linear-gradient(90deg,#a06f00,var(--gz-acc))] py-2 pl-4 pr-8 text-[15px] font-extrabold uppercase tracking-wide text-white [clip-path:polygon(0_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,0_100%)] md:text-[18px]">Latest news</span>
          <span className={`${merri.className} flex-1 py-2 text-[15px] font-bold leading-snug group-hover:text-[#a06f00] md:text-[18px]`}>{breaking.title} <span className="ml-1 text-[13px] font-normal text-[#a0461f]">{ago(breaking)}</span></span>
          <span className="pr-4 text-[22px] text-[#a06f00]" aria-hidden>›</span>
        </a>
      </div>

      <main className={W}>
        {/* slider with the lead headline below · today in brief */}
        <section className="mt-5 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-[#e3d3ad]">
          <div>
            <div className="gz-hero overflow-hidden rounded-md"><HeroCinema slides={heroSlides} /></div>
            <a href={href(lead)} className="group mt-4 block">
              <h1 className={`${H} text-[30px] md:text-[40px] group-hover:text-[#a06f00]`}><SplitWords text={lead.title} /></h1>
              {lead.summary && <p className="mt-2 text-[17px] leading-relaxed text-[#4a3f28]">{lead.summary}</p>}
              <p className="mt-2 text-[13px]"><b>{lead.author ? `By ${lead.author}` : site.name}</b> <span className="text-[#8a7a58]">| {site.name} |</span> <span className="font-semibold text-[#a0461f]">{ago(lead)}</span></p>
            </a>
          </div>
          {brief.length > 0 && (
            <aside className="lg:pl-8">
              <GHead>Today in brief</GHead>
              <ul className="pc-in pc-stagger divide-y divide-[#ece0c3]">
                {brief.map((a) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-3 py-3">
                      <span className="pc-zoom h-[64px] w-[100px] shrink-0 overflow-hidden rounded"><Img a={a} sizes="120px" /></span>
                      <span>
                        <span className={`${merri.className} block text-[15.5px] font-bold leading-snug group-hover:text-[#a06f00]`}>{a.title}</span>
                        <span className="text-[12px] text-[#8a7a58]">{ago(a)} | {a.category.replace(/-/g, " ")}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </section>

        <AdSlot position="top" className="mt-8" />

        {/* severe weather + drought · county · weather */}
        <section className="pc-in pc-stagger mt-8 grid gap-6 lg:grid-cols-3">
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center gap-3 bg-[#b3261e] px-4 py-2.5 text-white">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2 1 21h22L12 2zm1 15h-2v2h2v-2zm0-7h-2v5h2v-5z" /></svg>
              <div>
                <p className="text-[15px] font-extrabold uppercase leading-tight">Tornado &amp; severe weather</p>
                <p className="text-[12px] text-white/85">National Weather Service</p>
              </div>
            </div>
            <div className="p-4">
              {outline && (
                <div className="mb-3">
                  <StateMap outline={outline} fill={severe.length ? "#fde3a1" : "#f4ecd6"} stroke="#3d2f12" label="#3d2f12" font="var(--gz-serif), Georgia, serif" cities={citiesOf(site.state).slice(0, 5)} />
                </div>
              )}
              {severe.length ? (
                severe.slice(0, 3).map((al) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="mb-2 block text-[14px]"><b className="text-[#b3261e]">{al.event}</b> — {al.area}</a>)
              ) : (
                <p className="text-[14px]"><b className="text-[#2e6b3f]">No tornado or severe weather warnings</b> are in effect in {site.state} right now.</p>
              )}
              {drought && (
                <div className="mt-4 border-t border-[#ece0c3] pt-3">
                  <p className="text-[13px] font-extrabold uppercase tracking-wide">Drought across {site.state}</p>
                  <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-[#e8efe0]" role="img" aria-label="Share of the state in each drought category">
                    {DROUGHT.map(([k, label, color], i) => {
                      const v = Number(drought[k]) - Number(DROUGHT[i + 1] ? drought[DROUGHT[i + 1][0]] : 0);
                      return v > 0 ? <span key={label} title={`${label}: ${v.toFixed(1)}%`} style={{ width: `${v}%`, background: color }} /> : null;
                    })}
                  </div>
                  <p className="mt-1.5 text-[13px]">{drought.d1 > 0 ? <><b>{drought.d1.toFixed(1)}%</b> of the state in drought{drought.prev ? ` (${drought.prev.d1.toFixed(1)}% a month ago)` : ""}</> : <><b>{(100 - drought.none).toFixed(1)}%</b> abnormally dry, none in drought</>}</p>
                  <p className="text-[11px] text-[#8a7a58]">U.S. Drought Monitor, map of {new Date(drought.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</p>
                </div>
              )}
            </div>
          </div>
          <div className={`${card} p-5`}>
            <GHead>Your county</GHead>
            <p className="-mt-1 mb-3 text-[14px] text-[#4a3f28]">Local news, schools, events and more from all {counties.length} {site.state} counties.</p>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Polk", "Linn", "Scott", "Johnson", "Black Hawk", "Story", "Woodbury", "Dubuque"]).filter((c) => counties.includes(c))} />
            <p className="mt-4 text-[12px] font-bold uppercase tracking-wide">Browse by letter</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {letters.map((l) => <a key={l} href={`/search?q=${encodeURIComponent(`${counties.find((c) => c[0].toUpperCase() === l)} County`)}`} className="flex h-8 w-8 items-center justify-center rounded border border-[#e3d3ad] text-[14px] font-bold text-[#a06f00] hover:bg-[var(--gz-acc)] hover:text-white">{l}</a>)}
            </div>
          </div>
          {weather.length > 0 && (
            <div id="weather" className={`${card} scroll-mt-4 p-5`}>
              <GHead>Weather across {site.state}</GHead>
              <ul>
                {weather.map((x) => (
                  <li key={x.city} className="flex items-center gap-3 border-b border-[#ece0c3] py-1.5 text-[14.5px]">
                    <span className="flex-1 font-semibold">{x.city}</span>
                    <WxIcon short={x.short} isDay={x.isDay} size={24} />
                    <b className="w-10 text-right">{x.temp}°</b>
                    <span className="hidden w-28 truncate text-[12px] text-[#8a7a58] sm:block">{x.short}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* gas + airports strip */}
        {((gas && gas.grades[0]) || (airports && airports.length > 0)) && (
          <section className="pc-in pc-up mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md border border-[#e3d3ad] bg-white px-5 py-4">
            {gas && gas.grades[0] && (
              <>
                <p className={`${merri.className} text-[20px] font-bold italic`}>Gas prices this week</p>
                <p><span className={`${merri.className} text-[34px] font-black`}>${gas.grades[0].price.toFixed(2)}</span><span className="text-[15px]">/gal</span> <span className={`ml-2 rounded px-2 py-0.5 text-[13px] font-bold ${gas.grades[0].change > 0 ? "bg-[#fbe4dd] text-[#a0461f]" : "bg-[#e3f1e3] text-[#2e6b3f]"}`}>{gas.grades[0].change > 0 ? "↑" : "↓"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢</span></p>
                <p className="text-[12px] text-[#8a7a58]">{gas.isRegion ? gas.area : "Statewide"} average, regular · EIA, week of {gas.week}</p>
              </>
            )}
            {airports && airports.length > 0 && (
              <span className="ml-auto flex flex-wrap gap-4 text-[14px]">
                {airports.map((ap) => <span key={ap.code} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${ap.delays.length ? "bg-[#b3261e]" : "bg-[#2e6b3f]"}`} /><b>{ap.code}</b> <span className="text-[12px] text-[#8a7a58]">{ap.delays.length ? "delays" : "on time"}</span></span>)}
              </span>
            )}
          </section>
        )}

        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[#e3d3ad]">
            {pol.length > 0 && (
              <div>
                <GHead link="/politics">Politics</GHead>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden rounded"><Img a={pol[0]} /></span>
                  <span className={`${H} mt-3 block text-[22px] group-hover:text-[#a06f00]`}>{pol[0].title}</span>
                  {pol[0].summary && <span className="mt-1 block line-clamp-3 text-[14.5px] text-[#4a3f28]">{pol[0].summary}</span>}
                </a>
                {pol.slice(1).map((a) => <a key={a.slug} href={href(a)} className="mt-3 block border-t border-[#ece0c3] pt-2 text-[15px] font-bold leading-snug hover:text-[#a06f00]">{a.title}</a>)}
              </div>
            )}
            {biz.length > 0 && (
              <div className="lg:pl-8">
                <GHead link="/business">Business</GHead>
                <a href={href(biz[0])} className="group grid grid-cols-[1fr_130px] gap-3">
                  <span>
                    <span className={`${H} block text-[20px] group-hover:text-[#a06f00]`}>{biz[0].title}</span>
                    {biz[0].summary && <span className="mt-1 block line-clamp-4 text-[13.5px] text-[#4a3f28]">{biz[0].summary}</span>}
                  </span>
                  <span className="pc-zoom block aspect-[3/4] overflow-hidden rounded"><Img a={biz[0]} sizes="160px" /></span>
                </a>
                <ul className="mt-3 space-y-2">
                  {biz.slice(1).map((a) => <li key={a.slug} className="flex gap-2"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-[var(--gz-acc)]" /><a href={href(a)} className="text-[15px] font-bold leading-snug hover:text-[#a06f00]">{a.title}</a></li>)}
                </ul>
              </div>
            )}
            {spo.length > 0 && (
              <div className="lg:pl-8">
                <GHead link="/sports">Sports</GHead>
                <a href={href(spo[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden rounded"><Img a={spo[0]} /></span>
                  <span className={`${H} mt-3 block text-[22px] group-hover:text-[#a06f00]`}>{spo[0].title}</span>
                </a>
                {spo.slice(1).map((a) => <a key={a.slug} href={href(a)} className="mt-3 block border-t border-[#ece0c3] pt-2 text-[15px] font-bold leading-snug hover:text-[#a06f00]">{a.title}</a>)}
              </div>
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <GHead link="/opinion" more="More opinion">Opinion</GHead>
            <div className="pc-in pc-stagger grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] lg:divide-x lg:divide-[#e3d3ad]">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-4 ${i ? "lg:pl-6" : ""}`}>
                  <span className={`${merri.className} flex h-16 w-16 shrink-0 items-center justify-center rounded bg-[#efe3c4] text-[26px] font-black text-[var(--gz-ink)]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className="block text-[12px] font-extrabold uppercase tracking-wide text-[#a06f00]">{i === 0 ? `Our ${site.state}` : "Column"}</span>
                    <span className={`${merri.className} block text-[17px] font-bold leading-snug group-hover:text-[#a06f00]`}>{a.title}</span>
                    {a.author && <span className="text-[13px] text-[#8a7a58]">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* county by county */}
        {counties6.length >= 2 && (
          <section className="pc-in pc-up mt-12 rounded-md bg-[#f3e8cc] p-6">
            <GHead>County by county</GHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {counties6.map(([c, list]) => (
                <div key={c} className="pc-card rounded bg-white p-4">
                  <a href={`/search?q=${encodeURIComponent(`${c} County`)}`} className={`${merri.className} text-[18px] font-black text-[var(--gz-ink)] hover:text-[#a06f00]`}>{c} County ›</a>
                  <ul className="mt-2 space-y-2">
                    {list.map((a) => <li key={a.slug}><a href={href(a)} className="text-[14.5px] font-semibold leading-snug hover:text-[#a06f00]">{a.title}</a> <span className="text-[12px] text-[#8a7a58]">{ago(a)}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: g.ink, acc: g.acc, bg: g.paper, line: "#e3d3ad", text: "#2b2414", head: merri.className }} order={["numbersTickets", "weekTimeline", "exploreStrip"]} />

      <div className={W}>
        {life.length >= 2 && (
          <section className="pc-in pc-up mt-14">
            <GHead link="/life" more="More life">Life in {site.state}</GHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block rounded-md bg-white p-2 shadow-[0_8px_24px_-18px_rgba(60,40,0,.5)]">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden rounded"><Img a={a} /></span>
                  <span className={`${merri.className} mt-2 block px-1 pb-1 text-[16px] font-bold leading-snug group-hover:text-[#a06f00]`}>{a.title}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {safety.length > 1 && (
              <div className={`${card} p-5`}>
                <GHead>Public safety</GHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className="block border-b border-[#ece0c3] py-2 text-[15px] font-bold leading-snug hover:text-[#a06f00]">{a.title}</a>)}
              </div>
            )}
            {schools.length > 1 && (
              <div className={`${card} p-5`}>
                <GHead>Schools</GHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className="block border-b border-[#ece0c3] py-2 text-[15px] font-bold leading-snug hover:text-[#a06f00]">{a.title}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot rounded-md bg-[var(--gz-ink)] p-5 text-[#f6ecd6]">
                <p className={`${merri.className} mb-3 text-[22px] font-bold italic text-[var(--gz-acc)]`}>Most read</p>
                {mostRead.map((a, i) => (
                  <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/15 py-2.5 first:border-0">
                    <span className={`${merri.className} w-6 text-[24px] font-black leading-none text-[var(--gz-acc)]`}>{i + 1}</span>
                    <span className="text-[14.5px] font-semibold leading-snug hover:underline">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-up mt-12 grid gap-6 md:grid-cols-2">
            {lottery.map((x) => (
              <div key={x.game} className={`${card} p-5`}>
                <p className={`${merri.className} text-[19px] font-bold`}>{x.game} <span className="text-[13px] font-normal text-[#8a7a58]">· {new Date(x.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {x.numbers.map((n, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--gz-ink)] text-[16px] font-extrabold">{n.replace(/^0/, "")}</span>)}
                  {x.bonus && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gz-acc)] text-[16px] font-extrabold">{x.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-2 text-[11px] text-[#8a7a58]">Official draw record (New York State open data). Check your ticket with the {site.state} Lottery.</p>
              </div>
            ))}
          </section>
        )}

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <GHead link="/local-news" more="All the latest">Latest news</GHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block rounded-md bg-white p-3">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden rounded"><Img a={a} /></span>
                  <span className="mt-2 block text-[12px] font-extrabold uppercase tracking-wide text-[#a06f00]">{a.category.replace(/-/g, " ")}</span>
                  <span className={`${merri.className} block text-[18px] font-bold leading-snug group-hover:text-[#a06f00]`}>{a.title}</span>
                  <span className="text-[12px] text-[#8a7a58]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <GHead>More from {site.state}</GHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#ece0c3] py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[#a06f00]">{hour(a, tz)}</span>
                  <a href={href(a)} className="text-[15.5px] font-semibold leading-snug hover:text-[#a06f00]">{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-6 md:grid-cols-2 md:divide-x md:divide-[#e3d3ad]">
          <div className="flex flex-wrap items-center gap-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d19a00" strokeWidth="2" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>
            <div className="flex-1">
              <p className={`${merri.className} text-[24px] font-bold italic`}>Send us a tip</p>
              <p className="text-[14px] text-[#4a3f28]">Have a news tip, photo or story idea from your community? We want to hear from you.</p>
            </div>
            <a href="/contact" className="rounded border-2 border-[var(--gz-acc)] px-4 py-2 text-[14px] font-bold text-[#a06f00] hover:bg-[var(--gz-acc)] hover:text-white">Send a tip ›</a>
          </div>
          <div className="md:pl-6"><AlertsBox name={site.name} state={site.state} /></div>
        </section>
      </div>

      <GzFooter site={site} />
    </div>
  );
}
