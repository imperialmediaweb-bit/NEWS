import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Quake, VolcanoStatus, Buoy } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE, srcSetOf } from "../live/shared";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import Extras from "../extras/Extras";
import { crimson, nunito, coOf, coVars, CHead, CoTopBar, CoHeader, CoFooter , ok } from "./shared";

/**
 * Hawaii homepage — "coastal" family, from the generated Hawaii mockup
 * (21.11.2026): centred masthead, breaking line, the Imperial slider with the
 * lead story's headline set below it beside Today in brief; the state's own
 * module — Kilauea and Mauna Loa from the USGS Hawaiian Volcano Observatory,
 * the week's earthquakes — beside the county finder, weather across the
 * islands, gas and airports; an ocean band with live NOAA buoy readings;
 * politics, business, sports; island life, opinion, safety / schools / most
 * read, latest, more, tip and alerts. Real data only; Hawaii has no lottery.
 */

const SPORTS_HI = /\b(game|coach|football|basketball|baseball|volleyball|soccer|surf|surfing|pipeline|playoff|season|team|athlet|rainbow warriors|rainbow wahine|uh |tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|hpd|sheriff|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|jail|prison)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|doe|uh manoa)\b/i;

const LEVEL: Record<string, string> = { NORMAL: "#2e7d4f", ADVISORY: "#d4a017", WATCH: "#e67e22", WARNING: "#c0392b" };

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[#bfe3ee] to-[#f6d6e0]" />
  );

export default function HomeCoastal({
  site,
  articles,
  weather,
  counties,
  sections,
  alerts,
  gas,
  airports,
  quakes,
  volcanoes,
  buoys,
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
  fires?: unknown;
  outline?: unknown;
  subway?: unknown;
  volcanoes?: VolcanoStatus[] | null;
  buoys?: Buoy[] | null;
  uv?: unknown;
}) {
  const c = coOf(site);
  const tz = TZ[site.state] || "America/New_York";
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
  const heroSlides = take(articles.heroSide.concat(articles.trending), 5).map((a) => ({ id: a.slug, image: a.img, title: ok(a.title), subtitle: ok(a.summary), eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) }));
  const brief = take(articles.latestPosts.concat(pool), 5);
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 3);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", SPORTS_HI, 3);
  const life = sec("life", TOPIC_RE.life, 4);
  const opinion = take(articles.opinion, 4);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((w) => w.city === c.capital) || weather[0];
  const qs = quakes || [];
  const qDay = qs.filter((q) => Date.now() - q.time < 86400000);
  const qBig = [...qs].sort((a, b) => b.mag - a.mag)[0];
  const W = "mx-auto max-w-[1320px] px-4";
  const H = `${crimson.className} font-semibold leading-[1.1] text-[var(--co-ink)]`;
  const card = "pc-spot rounded-xl border border-[#dbe7ec] bg-white";

  return (
    <div className={`${nunito.className} ${crimson.variable} min-h-screen overflow-x-hidden bg-white text-[#24323c]`} style={coVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <CoTopBar site={site} capital={capital} />
      <CoHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-4`}>
        <a href={href(breaking)} className="group flex items-center gap-4 rounded-lg bg-[#fbeaf0]">
          <span className="shrink-0 rounded-l-lg bg-[var(--co-acc)] py-2 pl-4 pr-7 text-[13px] font-extrabold uppercase tracking-[.1em] text-white [clip-path:polygon(0_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,0_100%)] md:text-[14px]">Latest</span>
          <span className={`${crimson.className} flex-1 py-2 text-[17px] font-semibold leading-snug text-[var(--co-ink)] group-hover:text-[var(--co-acc)] md:text-[21px]`}>{ok(breaking.title)}</span>
          <span className="hidden pr-4 text-[13px] font-bold text-[var(--co-acc)] sm:block">{ago(breaking)} ›</span>
        </a>
      </div>

      <main className={W}>
        {/* slider with the lead headline below · today in brief */}
        <section className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:divide-x lg:divide-[var(--co-gold)]">
          <div>
            <div className="co-hero overflow-hidden rounded-xl"><HeroCinema slides={heroSlides} /></div>
            <a href={href(lead)} className="group mt-4 block">
              <p className="text-[13px] font-extrabold uppercase tracking-[.16em] text-[var(--co-acc)]">{lead.category.replace(/-/g, " ")}</p>
              <h1 className={`${H} mt-1 text-[34px] md:text-[44px] group-hover:text-[var(--co-acc)]`}><SplitWords text={ok(lead.title)} /></h1>
              {lead.summary && <p className={`${crimson.className} mt-2 text-[20px] italic text-[#4a5a66]`}>{ok(lead.summary)}</p>}
              <p className="mt-2 text-[13px] text-[#6b7b86]">{lead.author ? `By ${lead.author} | ` : ""}{ago(lead)}</p>
            </a>
          </div>
          {brief.length > 0 && (
            <aside className="lg:pl-8">
              <CHead>Today in brief</CHead>
              <ul className="pc-in pc-stagger divide-y divide-[#e4edf1]">
                {brief.map((a) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-3 py-3">
                      <span className="pc-zoom h-[64px] w-[96px] shrink-0 overflow-hidden rounded-md"><Img a={a} /></span>
                      <span>
                        <span className={`${crimson.className} block text-[17.5px] font-semibold leading-snug text-[var(--co-ink)] group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                        <span className="text-[11.5px] font-bold uppercase text-[var(--co-acc)]">{a.category.replace(/-/g, " ")}</span> <span className="text-[12px] italic text-[#7a8a94]">| {ago(a)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </section>

        <AdSlot position="top" className="mt-8" />

        {/* volcano & earthquake watch · county · weather · gas */}
        <section className="pc-in pc-stagger mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {volcanoes && volcanoes.length > 0 && (
            <div className={`${card} overflow-hidden bg-[linear-gradient(180deg,#eef6f9,#fff_40%)] p-5`}>
              <CHead>Volcano &amp; earthquake watch</CHead>
              <p className={`${crimson.className} -mt-3 mb-3 text-[15px] italic text-[#5b6b76]`}>Hawaiian Volcano Observatory (USGS)</p>
              {volcanoes.map((v) => (
                <a key={v.name} href={v.url} target="_blank" rel="noopener" className="mb-3 block border-b border-[#e4edf1] pb-3">
                  <p className="flex items-center gap-2 text-[15px] font-extrabold text-[var(--co-ink)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL[v.level] || "#888" }} />{v.name}: <span style={{ color: LEVEL[v.level] || "#555" }}>{v.level.charAt(0) + v.level.slice(1).toLowerCase()}</span>
                  </p>
                  {v.summary && <p className="mt-1 line-clamp-4 text-[13.5px] leading-snug text-[#4a5a66]">{ok(v.summary)}</p>}
                </a>
              ))}
              {quakes && (
                <p className="text-[14px]"><b className="text-[var(--co-ink)]">Earthquakes: {qDay.length} in the past 24 hours</b>{qBig && <span className="block text-[13px] italic text-[#5b6b76]">Largest this week: M{qBig.mag.toFixed(1)} {qBig.place}</span>}</p>
              )}
              <a href="https://www.usgs.gov/observatories/hvo" target="_blank" rel="noopener" className="mt-2 inline-block text-[13px] font-bold text-[var(--co-acc)]">USGS Hawai‘i dashboard ›</a>
            </div>
          )}
          <div className={`${card} p-5`}>
            <CHead>Your county</CHead>
            <p className={`${crimson.className} -mt-3 mb-3 text-[15px] italic text-[#5b6b76]`}>News, alerts and resources for your island community.</p>
            <CountySearch state={site.state} counties={counties} popular={["Honolulu", "Hawaii", "Maui", "Kauai"].filter((x) => counties.includes(x))} />
          </div>
          {weather.length > 0 && (
            <div id="weather" className={`${card} scroll-mt-4 p-5`}>
              <CHead>Weather across the islands</CHead>
              <ul>
                {weather.map((w) => (
                  <li key={w.city} className="flex items-center gap-3 border-b border-[#e4edf1] py-1.5 text-[15px]">
                    <span className="flex-1">{w.city}</span>
                    <WxIcon short={w.short} isDay={w.isDay} size={24} />
                    <b className="w-10 text-right">{w.temp}°F</b>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[#8a99a3]">National Weather Service</p>
            </div>
          )}
          <div className={`${card} p-5`}>
            {gas && gas.grades[0] && (
              <>
                <CHead>Gas prices</CHead>
                <p className={`${crimson.className} text-[46px] font-semibold leading-none text-[var(--co-ink)]`}>${gas.grades[0].price.toFixed(2)}<span className="text-[20px]">/gal</span></p>
                <p className={`text-[13px] font-bold ${gas.grades[0].change > 0 ? "text-[#c0392b]" : "text-[#2e7d4f]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢ from last week</p>
                <p className="mt-1 text-[12px] italic text-[#6b7b86]">{gas.isRegion ? `${gas.area} average — EIA does not publish a Hawai‘i-only weekly price` : "Statewide average"} · week of {gas.week}</p>
              </>
            )}
            {airports && airports.length > 0 && (
              <div className="mt-4 border-t border-[#e4edf1] pt-3">
                <p className="mb-1 text-[12px] font-extrabold uppercase tracking-[.14em] text-[var(--co-ink)]">Airports</p>
                {airports.map((ap) => (
                  <p key={ap.code} className="flex items-center gap-2 py-0.5 text-[14px]" title={ap.delays.map((d) => `${d.kind}: ${d.reason}`).join("; ")}>
                    <span className={`h-2 w-2 rounded-full ${ap.delays.length ? "bg-[#c0392b]" : "bg-[#2e7d4f]"}`} /><b>{ap.code}</b> {ap.name} <span className="ml-auto text-[12px] text-[#7a8a94]">{ap.delays.length ? "delays" : "on time"}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ocean band: live buoy readings */}
      {buoys && buoys.length > 0 && (
        <section className="pc-in pc-up relative mt-12 overflow-hidden bg-[linear-gradient(160deg,#0b4f6c,#0e7c99_55%,#36a9c4)] py-10 text-white">
          <svg className="absolute inset-x-0 bottom-0 h-16 w-full opacity-25" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden><path d="M0 40 Q180 0 360 40 T720 40 T1080 40 T1440 40 V80 H0z" fill="#fff" /></svg>
          <div className={`${W} relative`}>
            <p className="text-[13px] font-extrabold uppercase tracking-[.2em] text-[#ffd6e3]">Ocean &amp; surf</p>
            <h2 className={`${crimson.className} mt-1 text-[38px] font-semibold leading-tight md:text-[48px]`}>What the ocean is doing now</h2>
            <div className="pc-in pc-stagger mt-6 grid grid-cols-2 gap-4 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: buoys.length } as React.CSSProperties}>
              {buoys.map((bu) => (
                <div key={bu.name} className="rounded-xl bg-white/12 p-4 backdrop-blur-sm">
                  <p className="text-[14px] font-bold">{bu.name}</p>
                  <p className={`${crimson.className} mt-1 text-[44px] font-semibold leading-none`}>{bu.waveFt ?? "–"}<span className="text-[18px]"> ft</span></p>
                  <p className="text-[13px] text-white/80">waves{bu.periodS ? ` · ${bu.periodS} s period` : ""}</p>
                  {bu.waterF != null && <p className="mt-2 text-[13px]">Water {bu.waterF}°F</p>}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-white/70">Offshore buoy readings from the NOAA National Data Buoy Center. Wave heights at the beach differ; heed lifeguards and posted warnings.</p>
          </div>
        </section>
      )}

      <div className={W}>
        {alerts && alerts.length > 0 && (
          <section className="mt-8 rounded-lg border-l-4 border-[var(--co-acc)] bg-[#fdf2f5] px-4 py-3 text-[14px]">
            <b className="mr-3 uppercase tracking-[.12em] text-[var(--co-acc)]">Weather alerts</b>
            {alerts.map((al, i) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="hover:underline">{i ? " · " : ""}<b>{al.event}</b> ({al.area})</a>)}
          </section>
        )}

        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[var(--co-gold)]">
            {[["Politics", "/politics", pol], ["Business", "/business", biz], ["Sports", "/sports", spo]].map(([label, link, list], j) =>
              (list as HomeArticle[]).length > 0 ? (
                <div key={label as string} className={j ? "lg:pl-8" : ""}>
                  <CHead link={link as string}>{label as string}</CHead>
                  {(() => {
                    const [a, ...rest] = list as HomeArticle[];
                    return (
                      <>
                        <a href={href(a)} className="group block">
                          <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden rounded-lg"><Img a={a} /></span>
                          <span className={`${H} mt-3 block text-[24px] group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                          {a.summary && <span className={`${crimson.className} mt-1 block line-clamp-3 text-[16px] italic text-[#4a5a66]`}>{ok(a.summary)}</span>}
                          <span className="mt-1 block text-[12px] text-[#7a8a94]">{a.author ? `By ${a.author} | ` : ""}{ago(a)}</span>
                        </a>
                        <ul className="mt-3 space-y-2 border-t border-[#e4edf1] pt-3">
                          {rest.map((r) => <li key={r.slug} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--co-acc)]" /><a href={href(r)} className="text-[14.5px] font-semibold leading-snug hover:text-[var(--co-acc)]">{ok(r.title)}</a></li>)}
                        </ul>
                      </>
                    );
                  })()}
                </div>
              ) : null
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />

        {life.length >= 2 && (
          <section className="pc-in pc-up mt-12 rounded-2xl bg-[linear-gradient(135deg,#fdeef3,#eef7fa)] p-6 md:p-8">
            <CHead link="/life" more="More island life">Island life</CHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block rounded-xl bg-white p-2">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden rounded-lg"><Img a={a} /></span>
                  <span className={`${crimson.className} mt-2 block px-1 pb-1 text-[19px] font-semibold leading-snug text-[var(--co-ink)] group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <CHead link="/opinion" more="More opinion">Opinion</CHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] lg:divide-x lg:divide-[#e4edf1]">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-3 ${i ? "lg:pl-6" : ""}`}>
                  <span className={`${crimson.className} flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e6f3f7] text-[24px] font-semibold text-[var(--co-ink)]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className="block text-[11.5px] font-extrabold uppercase tracking-[.12em] text-[var(--co-acc)]">Column</span>
                    <span className={`${crimson.className} block text-[18px] font-semibold leading-snug text-[var(--co-ink)] group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                    {a.author && <span className="text-[12px] italic text-[#7a8a94]">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {safety.length > 1 && (
              <div className={`${card} p-5`}>
                <CHead>Public safety</CHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className={`${crimson.className} block border-b border-[#e4edf1] py-2 text-[17px] font-semibold leading-snug hover:text-[var(--co-acc)]`}>{ok(a.title)}</a>)}
              </div>
            )}
            {schools.length > 1 && (
              <div className={`${card} p-5`}>
                <CHead>Education</CHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className={`${crimson.className} block border-b border-[#e4edf1] py-2 text-[17px] font-semibold leading-snug hover:text-[var(--co-acc)]`}>{ok(a.title)}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot rounded-xl bg-[var(--co-ink)] p-5 text-white">
                <p className="mb-3 text-[16px] font-extrabold uppercase tracking-[.16em]">Most read</p>
                {mostRead.map((a, i) => (
                  <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/15 py-2.5 first:border-0">
                    <span className={`${crimson.className} w-6 text-[28px] font-semibold leading-none text-[#ff9ebd]`}>{i + 1}</span>
                    <span className="text-[14.5px] font-semibold leading-snug hover:text-[#ffd6e3]">{ok(a.title)}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: c.ink, acc: c.acc, bg: "#ffffff", line: c.gold, text: "#24323c", head: crimson.className }} />

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <CHead link="/local-news" more="All the latest">Latest news</CHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden rounded-lg"><Img a={a} /></span>
                  <span className="mt-2 block text-[11.5px] font-extrabold uppercase tracking-[.12em] text-[var(--co-acc)]">{a.category.replace(/-/g, " ")}</span>
                  <span className={`${crimson.className} block text-[21px] font-semibold leading-snug text-[var(--co-ink)] group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                  <span className="text-[12px] italic text-[#7a8a94]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <CHead>More from Hawai‘i</CHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#e4edf1] py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[var(--co-acc)]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${crimson.className} text-[17px] font-semibold leading-snug text-[var(--co-ink)] hover:text-[var(--co-acc)]`}>{ok(a.title)}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#fdeef3,#fff)] p-6">
            <p className={`${crimson.className} text-[30px] font-semibold text-[var(--co-ink)]`}>Send us a tip</p>
            <p className={`${crimson.className} mt-1 text-[17px] italic text-[#4a5a66]`}>Have a news tip, photo or video for our newsroom? We want to hear from you.</p>
            <a href="/contact" className="mt-3 inline-block rounded-md bg-[var(--co-acc)] px-5 py-2 text-[14px] font-bold text-white hover:brightness-110">Submit a tip ›</a>
          </div>
          <div className="rounded-2xl bg-[linear-gradient(135deg,#e6f3f7,#fff)] p-2"><AlertsBox name={site.name} state={site.state} /></div>
        </section>
      </div>

      <CoFooter site={site} />
    </div>
  );
}
