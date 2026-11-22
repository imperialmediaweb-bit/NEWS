import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, Storm, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Launch } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE, srcSetOf } from "../live/shared";
import PeachFx from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, sportsReOf } from "@/config/state-data";
import Extras from "../extras/Extras";
import Countdown from "./Countdown";
import { cond, text, tabOf, tabVars, THead, Slant, TabTopBar, TabHeader, TabFooter } from "./shared";

/**
 * Florida homepage — "tabloid" family, from the generated Florida mockup
 * (21.11.2026): logo left with the italic menu, slanted breaking tag, the
 * Imperial slider with huge italic capitals beside Today in brief, the
 * hurricane tracker and county finder, then Florida's own module — rocket
 * launches from the Space Coast with a live countdown — weather, gas and
 * airports, three section blocks, the big-stories wall, Sunshine State life,
 * opinion, crime / schools / most read, lottery, latest, more, tip and alerts.
 * Every module is real data or left out.
 */

const SPORTS_FL = /\b(game|coach|football|basketball|baseball|soccer|playoff|season|team|athlet|gators|seminoles|fsu|ucf|knights|canes|dolphins|jaguars|buccaneers|bucs|lightning|panthers|heat|magic|marlins|rays|inter miami|tournament|championship|win|wins|score|bowl)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|trooper|jail|prison|fdle)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|school board)\b/i;

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[var(--tb-ink)] to-[var(--tb-acc)]" />
  );

const Cat = ({ a }: { a: HomeArticle }) => <span className={`${cond.className} text-[15px] font-bold uppercase italic text-[var(--tb-acc)]`}>{a.category.replace(/-/g, " ")}</span>;

export default function HomeTabloid({
  site,
  articles,
  weather,
  storms,
  counties,
  sections,
  alerts,
  gas,
  lottery,
  airports,
  launches,
}: {
  site: SiteConfig;
  articles: HomeArticles;
  weather: CityWeather[];
  storms: { storms: Storm[] } | null;
  counties: string[];
  sections?: Record<string, HomeArticle[]>;
  alerts?: WeatherAlert[] | null;
  gas?: GasPrices | null;
  lottery?: LotteryDraw[] | null;
  airports?: AirportStatus[] | null;
  launches?: Launch[] | null;
  quakes?: unknown;
  fires?: unknown;
  outline?: unknown;
  subway?: unknown;
  volcanoes?: unknown;
  buoys?: unknown;
  uv?: unknown;
  snow?: unknown;
  drought?: unknown;
}) {
  const t = tabOf(site);
  const tz = TZ[site.state] || "America/New_York";
  const lead = articles.heroMain!;
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
  const pool = articles.pool || articles.latestPosts;
  const heroSlides = take([lead, ...articles.heroSide], 5).map((a) => ({ id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) }));
  const brief = take(articles.latestPosts.concat(articles.trending, pool), 5);
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 3);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", sportsReOf(site.state, SPORTS_FL), 3);
  const wall = take(articles.popular.concat(articles.trending, pool), 5);
  const life = sec("life", TOPIC_RE.life, 4);
  const opinion = take(articles.opinion, 4);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const fresh = breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000;
  const capital = weather.find((w) => w.city === t.capital) || weather[0];
  const popularCounties = popularOf(site.state, ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange", "Duval", "Pinellas", "Lee", "Polk", "Brevard"]).filter((c) => counties.includes(c));
  const nextLaunch = (launches || []).find((l) => new Date(l.net).getTime() > Date.now());
  const laterLaunches = (launches || []).filter((l) => l !== nextLaunch && new Date(l.net).getTime() > Date.now()).slice(0, 4);
  const W = "mx-auto max-w-[1360px] px-4";
  const big = `${cond.className} font-black uppercase italic leading-[.95] tracking-tight`;

  return (
    <div className={`${text.className} ${cond.variable} min-h-screen overflow-x-hidden bg-white text-[#141414]`} style={tabVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <TabTopBar site={site} capital={capital} />
      <TabHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-3`}>
        <a href={href(breaking)} className="group flex items-center gap-3 border-2 border-[var(--tb-acc)] bg-white pr-3">
          <span className={`${cond.className} shrink-0 bg-[var(--tb-acc)] py-1.5 pl-3 pr-6 text-[18px] font-black uppercase italic text-white [clip-path:polygon(0_0,100%_0,88%_100%,0_100%)] md:text-[24px]`}>{fresh ? "Breaking news" : "Latest"}</span>
          <span className={`${cond.className} flex-1 py-1 text-[18px] font-bold leading-tight text-[#111] group-hover:text-[var(--tb-acc)] md:text-[24px]`}>{breaking.title}</span>
          <span className="text-[26px] font-black text-[var(--tb-acc)]" aria-hidden>›</span>
        </a>
      </div>

      <main className={W}>
        {/* slider + today in brief */}
        <section className="mt-4 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="tb-hero overflow-hidden">
            <HeroCinema slides={heroSlides} />
          </div>
          {brief.length > 0 && (
            <aside>
              <THead>Today in brief</THead>
              <ul className="pc-in pc-stagger divide-y divide-[#e6e6e6]">
                {brief.map((a) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-3 py-2.5">
                      <span className="pc-zoom h-[72px] w-[96px] shrink-0 overflow-hidden"><Img a={a} /></span>
                      <span>
                        <span className={`${cond.className} block text-[19px] font-bold leading-[1.1] text-[#111] group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
                        <span className="mt-0.5 block text-[12px]"><Cat a={a} /> <span className="text-[#777]">· {ago(a)}</span></span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </section>

        <AdSlot position="top" className="mt-6" />

        {/* hurricane tracker + county */}
        <section className="pc-in pc-stagger mt-8 grid gap-5 lg:[grid-template-columns:repeat(auto-fit,minmax(380px,1fr))]">
          {storms && ["Florida", "New Jersey", "Texas", "Louisiana", "Alabama", "Mississippi", "Georgia", "South Carolina", "North Carolina"].includes(site.state) && (
            <div className="overflow-hidden border border-[#d9d9d9]">
              <div className="flex items-center gap-3 bg-[var(--tb-ink)] px-4 py-3 text-white">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className="text-[var(--tb-acc)]"><circle cx="12" cy="12" r="3" /><path d="M14 4c-6 0-10 3-10 8M10 20c6 0 10-3 10-8" strokeLinecap="round" /></svg>
                <div>
                  <p className={`${cond.className} text-[30px] font-black uppercase italic leading-none`}>Hurricane tracker</p>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-white/75">Atlantic &amp; Gulf · National Hurricane Center</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-[1.1fr_1fr]">
                <a href="https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7" target="_blank" rel="noopener" className="pc-zoom block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png" alt="National Hurricane Center seven-day tropical outlook" className="h-full w-full object-cover" loading="lazy" />
                </a>
                <div className="p-4">
                  {storms.storms.length === 0 ? (
                    <>
                      <p className={`${cond.className} flex items-center gap-2 text-[28px] font-black uppercase italic leading-none text-[var(--tb-ink)]`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f8a4c] text-[20px] not-italic text-white">✓</span> No active tropical systems</p>
                      <p className="mt-2 text-[14px] italic text-[#555]">The National Hurricane Center is not tracking any tropical cyclones in the Atlantic or the Gulf right now.</p>
                    </>
                  ) : (
                    storms.storms.map((st) => (
                      <p key={st.name} className="mb-2 text-[15px]"><b className={`${cond.className} text-[24px] font-black uppercase italic text-[var(--tb-acc)]`}>{st.classification} {st.name}</b><br />{st.intensity && `Winds ${st.intensity}`}{st.movement && ` · moving ${st.movement}`}</p>
                    ))
                  )}
                  <a href="https://www.nhc.noaa.gov/" target="_blank" rel="noopener" className={`${cond.className} mt-3 inline-block text-[18px] font-bold italic text-[var(--tb-acc)]`}>Full NHC outlook »</a>
                </div>
              </div>
            </div>
          )}
          <div className="border border-[#d9d9d9] p-5">
            <THead>Your county</THead>
            <p className="mb-3 text-[15px] italic text-[#555]">Local news, alerts and updates for your county — all {counties.length} of Florida&apos;s.</p>
            <CountySearch state={site.state} counties={counties} popular={popularCounties} />
          </div>
        </section>
      </main>

      {/* Florida's own module: launches from the Space Coast */}
      {nextLaunch && (
        <section className="pc-in pc-up relative mt-10 overflow-hidden bg-[radial-gradient(ellipse_at_70%_20%,#16365c,#071427_65%)] py-10 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_70%_60%,#fff,transparent),radial-gradient(1.5px_1.5px_at_40%_80%,#fff,transparent),radial-gradient(1px_1px_at_85%_15%,#fff,transparent),radial-gradient(1px_1px_at_10%_75%,#fff,transparent)] [background-size:320px_320px]" aria-hidden />
          <div className={`${W} relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]`}>
            <div>
              <Slant>Space Coast launches</Slant>
              <p className="mt-3 text-[13px] font-bold uppercase tracking-[.14em] text-white/70">Next liftoff · {nextLaunch.pad}</p>
              <h2 className={`${big} mt-1 text-[40px] md:text-[64px]`}>{nextLaunch.name.split("|").pop()?.trim()}</h2>
              <p className={`${cond.className} text-[22px] font-semibold italic text-[var(--tb-gold)]`}>{nextLaunch.name.split("|")[0].trim()} · {nextLaunch.provider}</p>
              <div className={`${cond.className} mt-5`}><Countdown to={nextLaunch.net} /></div>
              <p className="mt-4 flex flex-wrap items-center gap-3 text-[14px]">
                <span className={`rounded-full px-3 py-1 font-bold ${nextLaunch.confirmed ? "bg-[#1f8a4c]" : "bg-white/15"}`}>{nextLaunch.status}</span>
                <span className="text-white/80">{new Date(nextLaunch.net).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" })}</span>
              </p>
            </div>
            <div>
              {nextLaunch.image && (
                <div className="pc-zoom mb-4 hidden aspect-[16/9] overflow-hidden lg:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={nextLaunch.image} alt={nextLaunch.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}
              {laterLaunches.length > 0 && (
                <ul className="divide-y divide-white/15 border-y border-white/15">
                  {laterLaunches.map((l) => (
                    <li key={l.name + l.net} className="flex items-center gap-3 py-2.5">
                      <span className={`${cond.className} w-20 shrink-0 text-[18px] font-extrabold uppercase italic text-[var(--tb-gold)]`}>{new Date(l.net).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz })}</span>
                      <span className="flex-1 text-[14px] font-semibold leading-snug">{l.name}</span>
                      <span className="text-[11px] uppercase text-white/60">{l.confirmed ? "Go" : "TBD"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-white/55">Schedule from The Space Devs Launch Library. Launch times change often; check with the launch provider.</p>
            </div>
          </div>
        </section>
      )}

      <main className={W}>
        {/* weather + gas + airports */}
        <section id="weather" className="pc-in pc-up mt-10 grid scroll-mt-4 gap-5 lg:grid-cols-[1.5fr_1fr]">
          {weather.length > 0 && (
            <div>
              <THead>Weather across {site.state}</THead>
              <div className="grid grid-cols-2 gap-px bg-[#e2e2e2] sm:grid-cols-4">
                {weather.map((w) => (
                  <div key={w.city} className="bg-white p-3 text-center">
                    <p className={`${cond.className} text-[19px] font-extrabold uppercase italic text-[var(--tb-ink)]`}>{w.city}</p>
                    <div className="flex justify-center"><WxIcon short={w.short} isDay={w.isDay} size={40} /></div>
                    <p className={`${cond.className} text-[36px] font-black leading-none`}>{w.temp}°</p>
                    <p className="line-clamp-1 text-[12px] text-[#555]">{w.short}</p>
                    {w.nextName && <p className="mt-1 text-[11px] text-[#888]">{w.nextName}: {w.nextTemp}°</p>}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#888]">National Weather Service forecasts.</p>
            </div>
          )}
          <div className="space-y-5">
            {gas && gas.grades[0] && (
              <div className="border-2 border-[var(--tb-ink)] p-4">
                <p className={`${cond.className} text-[26px] font-black uppercase italic leading-none`}>Gas prices in {gas.isRegion ? gas.area : site.state} this week</p>
                <div className="mt-3 flex items-end gap-4">
                  <span className={`${cond.className} text-[64px] font-black leading-none text-[var(--tb-ink)]`}>${gas.grades[0].price.toFixed(2)}</span>
                  <span className={`mb-2 rounded-sm px-2 py-1 text-[16px] font-bold ${gas.grades[0].change > 0 ? "bg-[#fde8e4] text-[#c0392b]" : "bg-[#e3f4ea] text-[#1f8a4c]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢</span>
                </div>
                <p className="text-[13px] italic text-[#555]">Statewide average, regular unleaded · {gas.grades.slice(1).map((g) => `${g.grade} $${g.price.toFixed(2)}`).join(" · ")}</p>
                <p className="mt-2 text-[11px] text-[#888]">U.S. Energy Information Administration, week of {gas.week}</p>
              </div>
            )}
            {airports && airports.length > 0 && (
              <div className="bg-[var(--tb-ink)] p-4 text-white">
                <p className={`${cond.className} text-[26px] font-black uppercase italic leading-none`}>{site.state} airports now</p>
                <ul className="mt-2 divide-y divide-white/15">
                  {airports.map((ap) => (
                    <li key={ap.code} className="flex items-center gap-3 py-2">
                      <span className={`${cond.className} w-12 text-[22px] font-black italic text-[var(--tb-gold)]`}>{ap.code}</span>
                      <span className="flex-1 text-[14px]">{ap.name}{ap.delays[0] && <span className="block text-[12px] text-white/75">{ap.delays[0].kind} · {ap.delays[0].reason} · {ap.delays[0].detail}</span>}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ap.delays.length ? "bg-[var(--tb-acc)]" : "bg-[#1f8a4c]"}`}>{ap.delays.length ? "Delays" : "On time"}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-white/55">FAA airport status. Check your flight with your airline.</p>
              </div>
            )}
          </div>
        </section>

        {alerts && alerts.length > 0 && (
          <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-l-[6px] border-[#c0392b] bg-[#fff3f0] px-4 py-3">
            <Slant className="!bg-[#c0392b]">Weather alerts</Slant>
            {alerts.map((al) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="text-[14px] hover:underline"><b>{al.event}</b> — {al.area}</a>)}
          </section>
        )}

        {/* politics · business · sports */}
        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:grid-cols-3">
            {pol.length > 0 && (
              <div>
                <THead link="/politics" more="More politics">Politics</THead>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={pol[0]} /></span>
                  <span className={`${cond.className} mt-3 block text-[28px] font-extrabold leading-[1.02] group-hover:text-[var(--tb-acc)]`}>{pol[0].title}</span>
                  {pol[0].summary && <span className="mt-1 block line-clamp-2 text-[14px] italic text-[#555]">{pol[0].summary}</span>}
                </a>
                {pol.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${cond.className} mt-3 block border-t-2 border-[#111] pt-2 text-[19px] font-bold leading-tight hover:text-[var(--tb-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {biz.length > 0 && (
              <div>
                <THead link="/business" more="More business">Business</THead>
                <a href={href(biz[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={biz[0]} /></span>
                  <span className={`${cond.className} mt-3 block text-[28px] font-extrabold leading-[1.02] group-hover:text-[var(--tb-acc)]`}>{biz[0].title}</span>
                </a>
                <ol className="mt-3 space-y-2">
                  {biz.slice(1).map((a, i) => (
                    <li key={a.slug} className="flex gap-3"><span className={`${cond.className} text-[30px] font-black italic leading-none text-[var(--tb-gold)]`}>{i + 2}</span><a href={href(a)} className="text-[15px] font-semibold leading-snug hover:text-[var(--tb-acc)]">{a.title}</a></li>
                  ))}
                </ol>
              </div>
            )}
            {spo.length > 0 && (
              <div>
                <THead link="/sports" more="More sports">Sports</THead>
                <a href={href(spo[0])} className="group relative block">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={spo[0]} /></span>
                  <span className={`${big} absolute inset-x-3 bottom-3 bg-[var(--tb-acc)] px-3 py-2 text-[26px] text-white`}>{spo[0].title}</span>
                </a>
                {spo.slice(1).map((a) => <a key={a.slug} href={href(a)} className="mt-3 block text-[15px] font-semibold leading-snug hover:text-[var(--tb-acc)]">» {a.title}</a>)}
              </div>
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />
      </main>

      {/* the big stories wall */}
      {wall.length >= 3 && (
        <section className="pc-in pc-up mt-12 bg-[#111] py-10 text-white">
          <div className={W}>
            <THead light>The big stories</THead>
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <a href={href(wall[0])} className="group relative block min-h-[380px] overflow-hidden">
                <span className="pc-zoom absolute inset-0"><Img a={wall[0]} sizes="100vw" /></span>
                <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(0,0,0,.9))]" />
                <span className="absolute inset-x-0 bottom-0 p-5">
                  <Slant>{wall[0].category.replace(/-/g, " ")}</Slant>
                  <span className={`${big} mt-2 block text-[38px] md:text-[52px]`}>{wall[0].title}</span>
                </span>
              </a>
              <ol className="pc-in pc-stagger divide-y divide-white/15">
                {wall.slice(1).map((a, i) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-4 py-4">
                      <span className={`${cond.className} text-[56px] font-black italic leading-[.8] text-[var(--tb-acc)]`}>{i + 2}</span>
                      <span className={`${cond.className} text-[24px] font-bold leading-[1.05] group-hover:text-[var(--tb-gold)]`}>{a.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Sunshine State life */}
      {life.length >= 2 && (
        <section className="pc-in pc-up bg-[linear-gradient(120deg,#ffe3d6,#fff4d9_60%,#d9f2f0)] py-10">
          <div className={W}>
            <THead link="/life" more="More life">{site.state === "Florida" ? "Sunshine State life" : `Life in ${site.state}`}</THead>
            <div className="pc-in pc-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block bg-white p-2 shadow-[0_10px_30px_-20px_rgba(0,0,0,.5)]">
                  <span className="pc-zoom block aspect-square overflow-hidden"><Img a={a} /></span>
                  <span className={`${cond.className} mt-2 block px-1 text-[21px] font-extrabold leading-tight group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
                  <span className="block px-1 pb-1 text-[12px] text-[#777]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={W}>
        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <THead link="/opinion" more="More opinion">Opinion</THead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              {opinion.map((a) => (
                <a key={a.slug} href={href(a)} className="group flex gap-3">
                  <span className={`${cond.className} flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--tb-ink)] text-[24px] font-black text-white`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    {a.author && <span className={`${cond.className} block text-[15px] font-bold uppercase italic text-[var(--tb-acc)]`}>{a.author}</span>}
                    <span className="block text-[16px] font-bold leading-snug group-hover:text-[var(--tb-acc)]">{a.title}</span>
                    <span className="text-[12px] text-[#777]">{ago(a)}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {safety.length > 1 && (
              <div className="border-t-[6px] border-[#111] pt-3">
                <THead>Crime &amp; courts</THead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className={`${cond.className} block border-b border-[#e2e2e2] py-2.5 text-[20px] font-bold leading-tight hover:text-[var(--tb-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {schools.length > 1 && (
              <div className="border-t-[6px] border-[var(--tb-ink)] pt-3">
                <THead>Schools</THead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className={`${cond.className} block border-b border-[#e2e2e2] py-2.5 text-[20px] font-bold leading-tight hover:text-[var(--tb-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot bg-[var(--tb-acc)] p-5 text-white">
                <p className={`${cond.className} mb-3 text-[34px] font-black uppercase italic leading-none`}>Most read</p>
                <ol>
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-3 border-t border-white/30 py-2.5 first:border-0">
                      <span className={`${cond.className} w-7 text-[34px] font-black italic leading-none`}>{i + 1}</span>
                      <a href={href(a)} className="text-[15px] font-bold leading-snug hover:underline">{a.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-up mt-12 grid gap-4 md:grid-cols-2">
            {lottery.map((d) => (
              <div key={d.game} className="flex flex-wrap items-center gap-3 border-2 border-[#111] p-4">
                <p className={`${cond.className} w-full text-[28px] font-black uppercase italic leading-none`}>{d.game} <span className="text-[14px] font-semibold not-italic text-[#777]">{new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                {d.numbers.map((n, i) => <span key={i} className={`${cond.className} flex h-12 w-12 items-center justify-center rounded-full bg-[#111] text-[22px] font-black text-white`}>{n.replace(/^0/, "")}</span>)}
                {d.bonus && <span className={`${cond.className} flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tb-acc)] text-[22px] font-black text-white`}>{d.bonus.replace(/^0/, "")}</span>}
                <p className="w-full text-[11px] text-[#888]">Official draw record (New York State open data). Check your ticket with the {site.state} Lottery.</p>
              </div>
            ))}
          </section>
        )}

        <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: t.ink, acc: t.acc, bg: "#ffffff", line: "#e2e2e2", text: "#141414", head: `${cond.className} italic uppercase` }} order={["numbersTickets", "galleryList", "weekColumns"]} />

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <THead link="/local-news" more="All the latest">Latest news</THead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={a} /></span>
                  <span className="mt-2 block"><Cat a={a} /></span>
                  <span className={`${cond.className} block text-[24px] font-extrabold leading-[1.05] group-hover:text-[var(--tb-acc)]`}>{a.title}</span>
                  <span className="text-[12px] text-[#777]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <THead>More from {site.state}</THead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#e2e2e2] py-2.5">
                  <span className={`${cond.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--tb-acc)]`}>{hour(a, tz)}</span>
                  <a href={href(a)} className="text-[15.5px] font-semibold leading-snug hover:text-[var(--tb-acc)]">{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-5 md:grid-cols-2">
          <div className="flex flex-wrap items-center gap-5 bg-[var(--tb-ink)] p-6 text-white">
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12" strokeLinecap="round" /></svg>
            <div className="flex-1">
              <p className={`${cond.className} text-[36px] font-black uppercase italic leading-none`}>Send us a tip</p>
              <p className="mt-1 text-[14px] text-white/80">A news tip, photo or video from across {site.state}? Our newsroom wants to hear from you.</p>
            </div>
            <a href="/contact" className={`${cond.className} bg-[var(--tb-acc)] px-5 py-2 text-[20px] font-extrabold uppercase italic`}>Send a tip »</a>
          </div>
          <div className="border-2 border-[var(--tb-ink)]">
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>
      </div>

      <TabFooter site={site} />
    </div>
  );
}
