import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Fire, Quake, StateOutline, SnowStation } from "@/lib/local-data";
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
import { zilla, alfa, lora, wsOf, wsVars, WHead, WKick, Ridge, WsTopBar, WsHeader, WsFooter } from "./shared";

/**
 * Montana homepage — "western heritage" family, from the generated Montana
 * mockup (21.11.2026): paper masthead with a mountain ridge, a wood-type
 * breaking tag, the lead set in slab type beside the Imperial slider and
 * Today in brief; Montana wildfires on a map of the state (NIFC) and the
 * county finder; the state's own module — snow on the mountains from SNOTEL
 * stations and the week's earthquakes; weather, gas and airports; politics,
 * business, sports; opinion; the shared premium sections; life, safety /
 * schools / most read, lottery, latest, more, tip and alerts.
 */

const SPORTS_MT = /\b(game|coach|football|basketball|volleyball|rodeo|ski|playoff|season|team|athlet|griz|grizzlies|bobcats|cats|carroll|tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|trooper|jail|prison)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|msu|um )\b/i;

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[#c9d5d9] to-[#e9d7b4]" />
  );

export default function HomeWestern({
  site,
  articles,
  weather,
  counties,
  sections,
  alerts,
  gas,
  lottery,
  airports,
  quakes,
  fires,
  outline,
  snow,
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
  quakes?: Quake[] | null;
  fires?: Fire[] | null;
  outline?: StateOutline | null;
  subway?: unknown;
  volcanoes?: unknown;
  buoys?: unknown;
  uv?: unknown;
  snow?: SnowStation[] | null;
  drought?: unknown;
}) {
  const w = wsOf(site);
  const tz = TZ[site.state] || "America/Denver";
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
  const pol = sec("politics", TOPIC_RE.politics, 4);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", sportsReOf(site.state, SPORTS_MT), 3);
  const opinion = take(articles.opinion, 4);
  const life = sec("life", TOPIC_RE.life, 4);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((x) => x.city === w.capital) || weather[0];
  const fl = (fires || []).filter((f) => f.lon != null && f.lat != null);
  const qs = quakes || [];
  const W = "mx-auto max-w-[1340px] px-4";
  const H = `${zilla.className} font-bold leading-[1.08] text-[#1c1c1c]`;
  const card = "pc-spot border border-[#d9c9a8] bg-[#fbf6ec]";

  return (
    <div className={`ws-paper ${lora.className} ${zilla.variable} min-h-screen overflow-x-hidden text-[#2a2a2a]`} style={wsVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <WsTopBar site={site} capital={capital} />
      <WsHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-4`}>
        <a href={href(breaking)} className="group flex items-center gap-4 border border-[#c9b48a] bg-[#fbf6ec]">
          <span className={`${alfa.className} shrink-0 bg-[#a6461f] py-2 pl-4 pr-8 text-[16px] uppercase tracking-wide text-[#f4ecdc] [clip-path:polygon(0_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,0_100%)] md:text-[20px]`}>Latest news</span>
          <span className={`${zilla.className} flex-1 py-2 text-[17px] font-semibold leading-snug group-hover:text-[var(--ws-acc)] md:text-[20px]`}>{breaking.title}</span>
          <span className="hidden pr-4 text-[12px] italic text-[#6b5d45] sm:block">Updated {hour(breaking, tz)}</span>
        </a>
      </div>

      <main className={W}>
        {/* the opening, set like a western poster: the lead headline across the
            page in big slab capitals between amber rules, then the slider in a
            heavy wooden frame beside a navy board with the day's brief */}
        <section className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="h-[3px] w-16 bg-[var(--ws-acc)] sm:w-32" />
            <span className={`${alfa.className} text-[13px] uppercase tracking-[.24em] text-[var(--ws-acc)]`}>{lead.category.replace(/-/g, " ")} · {ago(lead)}</span>
            <span className="h-[3px] w-16 bg-[var(--ws-acc)] sm:w-32" />
          </div>
          <a href={href(lead)} className="group mx-auto mt-3 block max-w-[1180px]">
            <h1 className={`${zilla.className} text-[38px] font-bold uppercase leading-[1.02] tracking-tight text-[var(--ws-ink)] md:text-[64px] group-hover:text-[#a6461f]`}><SplitWords text={lead.title} /></h1>
            {lead.summary && <p className="mx-auto mt-4 max-w-[820px] text-[18px] italic leading-relaxed text-[#3a3a3a]">{lead.summary}</p>}
            <p className="mt-3 text-[13px]"><b>{lead.author ? `By ${lead.author}` : site.name}</b></p>
          </a>
          <div className="mx-auto mt-5 flex max-w-[600px] items-center gap-3" aria-hidden><span className="h-px flex-1 bg-[var(--ws-ink)]/40" /><span className="text-[var(--ws-acc)]">★ ★ ★</span><span className="h-px flex-1 bg-[var(--ws-ink)]/40" /></div>
        </section>
        <section className="mt-6 grid gap-0 lg:grid-cols-[1.7fr_1fr]">
          <div className="ws-hero border-[10px] border-[var(--ws-ink)] shadow-[inset_0_0_0_2px_var(--ws-acc)] outline outline-2 outline-offset-[-14px] outline-[var(--ws-acc)]"><HeroCinema slides={heroSlides} /></div>
          {brief.length > 0 && (
            <aside className="relative overflow-hidden bg-[var(--ws-ink)] p-6 text-[#f4ecdc]">
              <Ridge className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-25" stroke="#f4ecdc" />
              <p className={`${alfa.className} text-[24px] uppercase text-[var(--ws-acc)]`}>Today in brief</p>
              <ol className="relative mt-3">
                {brief.map((a, i) => (
                  <li key={a.slug} className="flex gap-3 border-b border-white/15 py-2.5 last:border-0">
                    <span className={`${alfa.className} w-7 shrink-0 text-[26px] leading-none text-[var(--ws-acc)]`}>{i + 1}</span>
                    <span>
                      <a href={href(a)} className={`${zilla.className} block text-[17px] font-semibold leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</a>
                      <span className="text-[12px] italic text-white/55">{ago(a)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </section>

        <AdSlot position="top" className="mt-8" />

        {/* wildfires map · county, on a navy band across the page */}
        <section className="ws-band pc-in pc-stagger mt-10 grid gap-6 py-8 lg:[grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]">
          {outline && !fires && qs.length > 0 && (
            <div className={card}>
              <WHead sub="Past 7 days · USGS">{site.state} earthquakes</WHead>
              <div className="grid items-center gap-4 p-4 pt-0 sm:grid-cols-[1.6fr_1fr]">
                <StateMap outline={outline} fill="#e3ecef" stroke="#1b3a4b" label="#1b3a4b" font="var(--ws-slab), Georgia, serif" cities={citiesOf(site.state).slice(0, 4)}
                  points={qs.map((q) => ({ key: q.url, lon: q.lon, lat: q.lat, r: 2 + (q.mag - 2.5) * 3, color: q.mag >= 4 ? "#c0392b" : q.mag >= 3 ? "#e67e22" : "#f1c40f", title: `M${q.mag.toFixed(1)} · ${q.place}` }))} />
                <div className="text-[14px]">
                  <p>Earthquakes this week: <b className={`${alfa.className} text-[24px] text-[#c0392b]`}>{qs.length}</b></p>
                  {[...qs].sort((a, b) => b.mag - a.mag).slice(0, 3).map((q) => <a key={q.url} href={q.url} target="_blank" rel="noopener" className="mt-1 block hover:underline"><b>M{q.mag.toFixed(1)}</b> {q.place}</a>)}
                  <p className="mt-3 text-[11px] italic text-[#7a6a50]">Source: U.S. Geological Survey, magnitude 2.5+</p>
                </div>
              </div>
            </div>
          )}
          {outline && fires && (
            <div className={card}>
              <WHead sub="Active fires (NIFC)">{site.state} wildfires</WHead>
              <div className="grid items-center gap-4 p-4 pt-0 sm:grid-cols-[1.6fr_1fr]">
                <StateMap outline={outline} fill="#efe3c6" stroke="#1b3a4b" label="#1b3a4b" font="var(--ws-slab), Georgia, serif"
                  cities={citiesOf(site.state).slice(0, 5)}
                  points={fl.map((f) => ({ key: f.name + f.county, lon: f.lon!, lat: f.lat!, r: Math.min(16, 4 + Math.sqrt(f.acres) / 12), color: "#c0392b", title: `${f.name} Fire · ${f.acres.toLocaleString("en-US")} acres` }))} />
                <div className="text-[14px]">
                  <p>Active wildfires: <b className={`${alfa.className} text-[24px] text-[#c0392b]`}>{fires.length}</b></p>
                  {fires[0] ? (
                    <p className="mt-2">Largest: <b>{fires[0].name} Fire</b>, {fires[0].acres.toLocaleString("en-US")} acres, {fires[0].county} County{fires[0].contained != null ? `, ${fires[0].contained}% contained` : ""}</p>
                  ) : (
                    <p className="mt-2 italic text-[#5d5040]">No wildfires over 10 acres are burning in {site.state} right now.</p>
                  )}
                  <p className="mt-3 text-[11px] italic text-[#7a6a50]">Source: National Interagency Fire Center</p>
                </div>
              </div>
            </div>
          )}
          <div className={card}>
            <WHead>Your county</WHead>
            <div className="p-4 pt-0">
              <p className="mb-3 text-[15px] text-[#3a3a3a]">News, alerts and resources for all {counties.length} {site.state} counties.</p>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Yellowstone", "Gallatin", "Missoula", "Flathead", "Cascade", "Lewis and Clark", "Ravalli", "Silver Bow"]).filter((c) => counties.includes(c))} />
            </div>
          </div>
        </section>

        {/* the state's own module: snow on the mountains, the week's earthquakes */}
        {snow && snow.length > 0 && (
          <section className="pc-in pc-up relative mt-10 overflow-hidden bg-[linear-gradient(180deg,#1b3a4b,#24506a)] p-6 text-[#f4ecdc] md:p-8">
            <Ridge className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-30" stroke="#f4ecdc" />
            <p className={`${alfa.className} text-[14px] uppercase tracking-[.14em] text-[var(--ws-acc)]`}>High country report</p>
            <h2 className={`${zilla.className} mt-1 text-[32px] font-bold leading-tight md:text-[42px]`}>Snow on the mountains</h2>
            {snow && snow.length > 0 && (
              <div className="pc-in pc-stagger relative mt-5 grid grid-cols-2 gap-4 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: snow.length } as React.CSSProperties}>
                {snow.map((s) => (
                  <div key={s.name} className="border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="text-[13px] font-semibold">{s.name}</p>
                    <p className={`${alfa.className} mt-1 text-[40px] leading-none`}>{s.depthIn ?? "–"}<span className="text-[16px]">&quot;</span></p>
                    <p className="text-[12px] text-white/75">snow depth{s.change3d ? ` · ${s.change3d > 0 ? "+" : ""}${s.change3d}" in 3 days` : ""}</p>
                    {s.sweIn != null && <p className="mt-1 text-[12px] text-white/60">{s.sweIn}&quot; of water in the snow</p>}
                  </div>
                ))}
              </div>
            )}
            {qs.length > 0 && (
              <p className="relative mt-5 text-[14px]"><b className="text-[var(--ws-acc)]">Earthquakes this week:</b> {qs.length} of magnitude 2.5 or more in {site.state}{qs[0] ? `, the latest M${qs[0].mag.toFixed(1)} ${qs[0].place}` : ""} (USGS).</p>
            )}
            <p className="relative mt-3 text-[11px] text-white/55">Snow from NRCS SNOTEL mountain stations, daily readings.</p>
          </section>
        )}

        {/* weather · gas and airports */}
        <section id="weather" className="pc-in pc-up mt-10 grid scroll-mt-4 gap-6 lg:grid-cols-[1.6fr_1fr]">
          {weather.length > 0 && (
            <div className={card}>
              <WHead>Weather across {site.state}</WHead>
              <div className="grid grid-cols-2 gap-y-4 p-4 pt-0 sm:grid-cols-4">
                {weather.map((x) => (
                  <div key={x.city} className="text-center">
                    <p className={`${alfa.className} text-[13px] uppercase`}>{x.city}</p>
                    <div className="flex justify-center"><WxIcon short={x.short} isDay={x.isDay} size={36} /></div>
                    <p className={`${zilla.className} text-[28px] font-bold leading-none`}>{x.temp}°</p>
                    {x.nextTemp != null && <p className="text-[12px] text-[#7a6a50]">{x.nextTemp}°</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className={card}>
            <WHead>Gas &amp; travel</WHead>
            <div className="p-4 pt-0">
              {gas && gas.grades[0] && (
                <>
                  <p className={`${alfa.className} text-[44px] leading-none text-[var(--ws-acc)]`}>${gas.grades[0].price.toFixed(2)}</p>
                  <p className="text-[13px]">per gallon, regular · <b className={gas.grades[0].change > 0 ? "text-[#a6461f]" : "text-[#2e6b3f]"}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢</b> from last week</p>
                  <p className="text-[11.5px] italic text-[#7a6a50]">{gas.isRegion ? `${gas.area} average (EIA)` : "Statewide average (EIA)"}</p>
                </>
              )}
              {airports && airports.length > 0 && (
                <div className="mt-3 border-t border-[#e3d6ba] pt-2">
                  {airports.map((ap) => (
                    <p key={ap.code} className="flex items-center gap-2 py-0.5 text-[14px]"><span className={`h-2 w-2 rounded-full ${ap.delays.length ? "bg-[#a6461f]" : "bg-[#2e6b3f]"}`} /><b>{ap.code}</b> {ap.name} <span className="ml-auto text-[12px] italic text-[#7a6a50]">{ap.delays.length ? "delays" : "on time"}</span></p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {alerts && alerts.length > 0 && (
          <section className="mt-6 border-l-4 border-[#a6461f] bg-[#fbf0e4] px-4 py-3 text-[14px]">
            <b className={`${alfa.className} mr-3 uppercase text-[#a6461f]`}>Weather alerts</b>
            {alerts.map((al, i) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="hover:underline">{i ? " · " : ""}<b>{al.event}</b> ({al.area})</a>)}
          </section>
        )}

        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[#d9c9a8]">
            {pol.length > 0 && (
              <div>
                <WKick><a href="/politics">Politics</a></WKick>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={pol[0]} /></span>
                  <span className={`${H} mt-3 block text-[25px] group-hover:text-[var(--ws-ink)]`}>{pol[0].title}</span>
                  {pol[0].summary && <span className="mt-1 block line-clamp-3 text-[15px] text-[#3a3a3a]">{pol[0].summary}</span>}
                </a>
                <ul className="mt-3 space-y-2">
                  {pol.slice(1).map((a) => <li key={a.slug} className="flex gap-2"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-[var(--ws-acc)]" /><a href={href(a)} className="text-[15px] font-semibold leading-snug underline decoration-[#d9c9a8] underline-offset-2 hover:text-[var(--ws-acc)]">{a.title}</a></li>)}
                </ul>
              </div>
            )}
            {biz.length > 0 && (
              <div className="lg:pl-8">
                <WKick><a href="/business">Business</a></WKick>
                <a href={href(biz[0])} className="group block">
                  <span className={`${H} block text-[27px] group-hover:text-[var(--ws-ink)]`}>{biz[0].title}</span>
                  {biz[0].summary && <span className="mt-2 block line-clamp-3 text-[15px] text-[#3a3a3a]">{biz[0].summary}</span>}
                  <span className="pc-zoom mt-3 block aspect-[16/10] overflow-hidden"><Img a={biz[0]} /></span>
                </a>
                {biz.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${zilla.className} mt-3 block border-t border-[#e3d6ba] pt-2 text-[17px] font-semibold leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {spo.length > 0 && (
              <div className="lg:pl-8">
                <WKick><a href="/sports">Sports</a></WKick>
                <a href={href(spo[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={spo[0]} /></span>
                  <span className={`${H} mt-3 block text-[25px] group-hover:text-[var(--ws-ink)]`}>{spo[0].title}</span>
                </a>
                {spo.slice(1).map((a) => (
                  <a key={a.slug} href={href(a)} className="mt-3 block bg-[#f1e6cc] p-3">
                    <span className={`${alfa.className} block text-[12px] uppercase text-[var(--ws-acc)]`}>Roundup</span>
                    <span className="block text-[14.5px] font-semibold leading-snug">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12 border-y-2 border-[var(--ws-acc)]/40 py-6">
            <div className="mb-4 flex items-baseline gap-4">
              <p className={`${alfa.className} text-[28px] uppercase text-[var(--ws-acc)]`}>Opinion</p>
              <p className="italic text-[#5d5040]">Ideas, perspectives and debate from across {site.state}.</p>
            </div>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] lg:divide-x lg:divide-[#d9c9a8]">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-3 ${i ? "lg:pl-6" : ""}`}>
                  <span className={`${alfa.className} flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--ws-ink)] text-[22px] text-[#f4ecdc]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className={`${zilla.className} block text-[18px] font-bold leading-snug group-hover:text-[var(--ws-acc)]`}>{a.title}</span>
                    {a.author && <span className="text-[13px] italic text-[#6b5d45]">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: w.ink, acc: w.acc, bg: w.paper, line: "#d9c9a8", text: "#2a2a2a", head: zilla.className }} order={["cities", "weekColumns", "galleryList"]} />

      <div className={W}>
        {life.length >= 2 && (
          <section className="pc-in pc-up mt-14">
            <WHead link="/life" more="More life">Life in {site.state}</WHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block border border-[#d9c9a8] bg-[#fbf6ec] p-2">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={a} /></span>
                  <span className={`${zilla.className} mt-2 block px-1 pb-1 text-[18px] font-semibold leading-snug group-hover:text-[var(--ws-acc)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {safety.length > 1 && (
              <div className={card}>
                <WHead>Crime &amp; courts</WHead>
                <div className="p-4 pt-0">{safety.map((a) => <a key={a.slug} href={href(a)} className={`${zilla.className} block border-b border-[#e3d6ba] py-2 text-[17px] font-semibold leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</a>)}</div>
              </div>
            )}
            {schools.length > 1 && (
              <div className={card}>
                <WHead>Schools</WHead>
                <div className="p-4 pt-0">{schools.map((a) => <a key={a.slug} href={href(a)} className={`${zilla.className} block border-b border-[#e3d6ba] py-2 text-[17px] font-semibold leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</a>)}</div>
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot bg-[var(--ws-ink)] p-5 text-[#f4ecdc]">
                <p className={`${alfa.className} mb-3 text-[22px] uppercase text-[var(--ws-acc)]`}>Most read</p>
                {mostRead.map((a, i) => (
                  <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/15 py-2.5 first:border-0">
                    <span className={`${alfa.className} w-6 text-[26px] leading-none text-[var(--ws-acc)]`}>{i + 1}</span>
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
                <p className={`${alfa.className} text-[20px] uppercase`}>{x.game} <span className={`${lora.className} text-[13px] normal-case italic text-[#7a6a50]`}>{new Date(x.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {x.numbers.map((n, i) => <span key={i} className={`${zilla.className} flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--ws-ink)] text-[17px] font-bold`}>{n.replace(/^0/, "")}</span>)}
                  {x.bonus && <span className={`${zilla.className} flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ws-acc)] text-[17px] font-bold`}>{x.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-2 text-[11px] italic text-[#7a6a50]">Official draw record (New York State open data). Check your ticket with the {site.state} Lottery.</p>
              </div>
            ))}
          </section>
        )}

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <WHead link="/local-news" more="All the latest">Latest news</WHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                  <span className={`${alfa.className} mt-2 block text-[12px] uppercase text-[var(--ws-acc)]`}>{a.category.replace(/-/g, " ")}</span>
                  <span className={`${zilla.className} block text-[20px] font-bold leading-snug group-hover:text-[var(--ws-ink)]`}>{a.title}</span>
                  <span className="text-[12px] italic text-[#7a6a50]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <WHead>More from {site.state}</WHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#e3d6ba] py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--ws-acc)]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${zilla.className} text-[17px] font-semibold leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-6 md:grid-cols-2">
          <div className="flex flex-wrap items-center gap-5 bg-[var(--ws-ink)] p-6 text-[#f4ecdc]">
            <p className={`${alfa.className} text-[30px] uppercase leading-none`}>Send us a tip</p>
            <p className="flex-1 text-[14.5px] italic text-white/80">Have a news tip, photo or video from your community? We want to hear from you.</p>
            <a href="/contact" className={`${alfa.className} bg-[var(--ws-acc)] px-4 py-2 text-[15px] uppercase text-[#1b1b1b]`}>Send a tip →</a>
          </div>
          <div className={card}><AlertsBox name={site.name} state={site.state} /></div>
        </section>
      </div>

      <WsFooter site={site} />
    </div>
  );
}
