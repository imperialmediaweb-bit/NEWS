import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, Storm, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Launch } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE } from "../live/shared";
import HeroCinema from "../live/HeroCinema";
import PeachFx from "./PeachFx";
import { display, body, peachOf, peachVars, PHead, Ico, PeachTopBar, PeachHeader, PeachFooter } from "./shared";

/**
 * Georgia homepage — "peach" family, built from the generated Georgia mockup
 * (21.11.2026): centred masthead with the slogan, breaking bar and a running
 * ribbon, lead story beside a live timeline, brief / hurricane tracker /
 * county, weather across the state with gas prices, three section columns
 * laid out differently, then a longer page than the mockup (bento report,
 * Life strip, opinion, safety / schools / most read, lottery, latest, more
 * headlines, tip and alerts). Every module shows real data or is left out.
 */

const SPORTS_GA = /\b(game|coach|football|basketball|baseball|soccer|playoff|season|team|athlet|bulldogs|uga|yellow jackets|georgia tech|falcons|braves|hawks|atlanta united|dream|eagles|tournament|championship|win|wins|score|bowl)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|trooper|jail|prison|gbi)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|board of education)\b/i;

const Img = ({ a, className = "", eager = false }: { a: HomeArticle; className?: string; eager?: boolean }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} alt="" className={`h-full w-full object-cover ${className}`} loading={eager ? "eager" : "lazy"} />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[var(--pc-acc)]/40 to-[var(--pc-cu)]/50" />
  );

const Kicker = ({ a }: { a: HomeArticle }) => <span className="text-[12px] font-bold uppercase tracking-[.08em] text-[var(--pc-acc)]">{a.category.replace(/-/g, " ")}</span>;

export default function HomePeach({
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
}) {
  const p = peachOf(site);
  const tz = TZ[site.state] || "America/New_York";
  const lead = articles.heroMain!;
  const used = new Set<string>([lead.slug]);
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
  // The Imperial cinematic slider in the lead spot: the lead and four more top stories.
  const heroSlides = [lead, ...articles.heroSide]
    .filter((a, i, arr) => a && arr.findIndex((b) => b.slug === a.slug) === i)
    .slice(0, 5)
    .map((a) => {
      used.add(a.slug);
      return { id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) };
    });
  const live = take(articles.latestPosts.concat(articles.heroSide), 5);
  const brief = take(articles.trending.concat(articles.popular, articles.localNews, pool), 5);
  // Section columns: the section's own stories first, then recent stories
  // whose headline is about it.
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 4);
  const biz = sec("business", TOPIC_RE.business, 4);
  const spo = sec("sports", SPORTS_GA, 4);
  const report = take(articles.heroSide.concat(pool), 5);
  const life = sec("life", TOPIC_RE.life, 6);
  const opinion = take(articles.opinion, 3);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const ribbon = articles.latestPosts.slice(0, 10);
  const breaking = live[0] || lead;
  const fresh = breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000;
  const capital = weather.find((w) => w.city === p.capital) || weather[0];
  const popularCounties = ["Fulton", "Gwinnett", "Cobb", "DeKalb", "Chatham", "Clayton", "Henry", "Forsyth", "Cherokee", "Richmond"].filter((c) => counties.includes(c));
  const W = "mx-auto max-w-[1360px] px-4";
  const card = "pc-spot rounded-md border border-[var(--pc-cu)]/30 bg-white";

  return (
    <div className={`${body.className} ${display.variable} min-h-screen overflow-x-hidden bg-[var(--pc-paper)] text-[#2b1d17]`} style={peachVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PeachTopBar site={site} capital={capital} />
      <PeachHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking bar */}
      <div className={`${W} mt-3`}>
        <a href={href(breaking)} className="group flex items-stretch overflow-hidden rounded-sm border border-[var(--pc-acc)]/40 bg-white">
          <span className={`${display.className} flex shrink-0 items-center bg-[var(--pc-acc)] px-3 text-[14px] font-extrabold uppercase tracking-wide text-white md:px-5 md:text-[20px]`}>{fresh ? "Breaking news" : "Latest"}</span>
          <span className={`${display.className} flex-1 px-3 py-2 text-[15px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)] md:px-4 md:py-2.5 md:text-[19px]`}>{breaking.title} <span className="text-[var(--pc-acc)]">›</span></span>
          <span className="hidden items-center gap-2 px-4 text-[13px] font-bold uppercase text-[var(--pc-acc)] md:flex"><span className="pc-dot" aria-hidden />Live</span>
        </a>
      </div>

      {/* running ribbon of the latest headlines (Marquee) */}
      {ribbon.length > 3 && (
        <div className={`${W} mt-2`}>
          <div className="pc-marquee border-y border-[var(--pc-cu)]/30 py-2 text-[14px]">
            <div className="pc-marquee-track">
              {[...ribbon, ...ribbon].map((a, i) => (
                <a key={i} href={href(a)} aria-hidden={i >= ribbon.length} tabIndex={i >= ribbon.length ? -1 : undefined} className="flex shrink-0 items-center gap-2 px-6 text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">
                  <span className="font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-4 text-[var(--pc-acc)]" aria-hidden>◆</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className={W}>
        {/* lead + live timeline */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="pc-hero overflow-hidden rounded-md">
            <HeroCinema slides={heroSlides} />
          </div>
          {live.length > 0 && (
            <aside className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-[.06em] text-[var(--pc-acc)]"><span className="pc-dot" aria-hidden /> Live updates</p>
                <span className="text-[12px] text-[#7a6a62]">{site.state} time</span>
              </div>
              <h2 className={`${display.className} mt-2 text-[22px] font-extrabold leading-tight text-[var(--pc-ink)]`}>The latest across {site.state}</h2>
              <ol className="relative mt-4 border-l-2 border-[var(--pc-acc)]/35 pl-5">
                {live.map((a) => (
                  <li key={a.slug} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--pc-acc)]" aria-hidden />
                    <span className="text-[12px] font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                    <a href={href(a)} className="block text-[15px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title}</a>
                  </li>
                ))}
              </ol>
              <a href="/local-news" className="mt-4 block rounded-sm border border-[var(--pc-acc)] py-2 text-center text-[14px] font-bold text-[var(--pc-acc)] transition hover:bg-[var(--pc-acc)] hover:text-white">See all the latest →</a>
            </aside>
          )}
        </section>

        {/* brief · hurricane tracker · county */}
        <section className="pc-in pc-stagger mt-6 grid gap-4 lg:grid-cols-3">
          {brief.length > 0 && (
            <div className={`${card} p-5`}>
              <PHead icon={Ico.brief}>Today in brief</PHead>
              <ul className="divide-y divide-[var(--pc-cu)]/20">
                {brief.map((a) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-3 py-2.5">
                      <span className="pc-zoom h-[58px] w-[84px] shrink-0 overflow-hidden rounded-sm"><Img a={a} /></span>
                      <span>
                        <Kicker a={a} /> <span className="text-[12px] text-[#8a7a72]">· {ago(a)}</span>
                        <span className="block text-[15px] font-semibold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]">{a.title}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {storms && (
            <div className={`${card} p-5`}>
              <PHead icon={Ico.storm}>Hurricane tracker</PHead>
              <p className="mb-2 text-[13px] text-[#6d5d55]"><b className="text-[var(--pc-ink)]">Atlantic &amp; Gulf</b> · National Hurricane Center</p>
              <a href="https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7" target="_blank" rel="noopener" className="pc-zoom block overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png" alt="National Hurricane Center seven-day tropical outlook for the Atlantic" className="w-full" loading="lazy" />
              </a>
              <div className="mt-3 rounded-sm bg-[var(--pc-ink)] p-3 text-white">
                {storms.storms.length === 0 ? (
                  <p className="text-[14px] font-semibold">✓ No active storms in the Atlantic or Gulf right now</p>
                ) : (
                  storms.storms.map((st) => (
                    <p key={st.name} className="text-[14px]"><b>{st.classification} {st.name}</b>{st.intensity ? ` · winds ${st.intensity}` : ""}{st.movement ? ` · ${st.movement}` : ""}</p>
                  ))
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[13px] font-semibold">
                <a href="https://www.nhc.noaa.gov/cyclones/" target="_blank" rel="noopener" className="rounded-sm bg-[var(--pc-acc)] py-2 text-white hover:brightness-110">Track</a>
                <a href="https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7" target="_blank" rel="noopener" className="rounded-sm border border-[var(--pc-cu)]/40 py-2 text-[var(--pc-ink)] hover:border-[var(--pc-acc)]">Outlook</a>
                <a href="https://www.star.nesdis.noaa.gov/GOES/sector.php?sat=G19&sector=se" target="_blank" rel="noopener" className="rounded-sm border border-[var(--pc-cu)]/40 py-2 text-[var(--pc-ink)] hover:border-[var(--pc-acc)]">Satellite</a>
              </div>
            </div>
          )}
          <div className={`${card} p-5`}>
            <PHead icon={Ico.pin}>Your county</PHead>
            <p className="mb-3 text-[15px] text-[#5a4a42]">News, alerts and resources for your {site.state} county.</p>
            <CountySearch state={site.state} counties={counties} popular={popularCounties} />
          </div>
        </section>

        {/* weather across the state + gas */}
        {(weather.length > 0 || gas) && (
          <section id="weather" className="pc-in pc-up mt-6 grid scroll-mt-4 gap-4 lg:grid-cols-[1fr_380px]">
            {weather.length > 0 && (
              <div className={`${card} p-5`}>
                <PHead icon={Ico.sun}>Weather across {site.state}</PHead>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {weather.map((w) => (
                    <div key={w.city} className="pc-card rounded-sm border border-[var(--pc-cu)]/20 bg-[var(--pc-paper)] p-3 text-center">
                      <p className="text-[14px] font-bold text-[var(--pc-ink)]">{w.city}</p>
                      <div className="mt-1 flex items-center justify-center gap-2"><WxIcon short={w.short} isDay={w.isDay} size={34} /><span className={`${display.className} text-[28px] font-extrabold text-[var(--pc-ink)]`}>{w.temp}°</span></div>
                      <p className="line-clamp-1 text-[12px] text-[#6d5d55]">{w.short}</p>
                      {w.nextName && <p className="mt-1 border-t border-[var(--pc-cu)]/20 pt-1 text-[11.5px] text-[#7a6a62]">{w.nextName}: {w.nextTemp}° · {w.nextShort}</p>}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[#8a7a72]">Forecasts from the National Weather Service.</p>
              </div>
            )}
            {((airports && airports.length > 0) || (gas && gas.grades[0])) && (
              <div className="space-y-4">
                {/* the state's signature module: live FAA status at its airports */}
                {airports && airports.length > 0 && (
                  <div className="pc-spot rounded-md bg-[var(--pc-ink)] p-5 text-white">
                    <PHead icon={Ico.plane} light>Flights right now</PHead>
                    <ul className="space-y-3">
                      {airports.map((ap) => (
                        <li key={ap.code} className="rounded-sm bg-white/[.06] p-3">
                          <div className="flex items-center gap-3">
                            <span className={`${display.className} text-[26px] font-black leading-none text-[var(--pc-acc)]`}>{ap.code}</span>
                            <span className="flex-1 text-[14px] font-semibold">{ap.name}</span>
                            {ap.delays.length === 0 ? (
                              <span className="rounded-full bg-[#2e7d4f] px-2.5 py-0.5 text-[12px] font-bold">On time</span>
                            ) : (
                              <span className="rounded-full bg-[#b3261e] px-2.5 py-0.5 text-[12px] font-bold">Delays</span>
                            )}
                          </div>
                          {ap.delays.map((d, i) => (
                            <p key={i} className="mt-1.5 text-[13px] text-white/85"><b>{d.kind}</b>{d.reason ? ` · ${d.reason}` : ""}{d.detail ? ` · ${d.detail}` : ""}</p>
                          ))}
                          {ap.delays.length === 0 && <p className="mt-1.5 text-[13px] text-white/70">No FAA delays or ground stops reported.</p>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11px] text-white/55">Federal Aviation Administration, National Airspace System status. Check your flight with your airline.</p>
                  </div>
                )}
                {gas && gas.grades[0] && (
                  gas.isRegion ? (
                    <div className={`${card} flex items-center gap-4 p-4`}>
                      <span className="text-[var(--pc-acc)]">{Ico.pump}</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold uppercase tracking-wide text-[#7a6a62]">Gas · {gas.area} average</p>
                        <p className="text-[13px] text-[#8a7a72]">EIA, week of {gas.week}</p>
                      </div>
                      <span className={`${display.className} text-[28px] font-extrabold text-[var(--pc-ink)]`}>${gas.grades[0].price.toFixed(2)}</span>
                      <span className={`text-[13px] font-bold ${gas.grades[0].change > 0 ? "text-[#b3261e]" : "text-[#2e7d4f]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"}{Math.abs(gas.grades[0].change * 100).toFixed(0)}¢</span>
                    </div>
                  ) : (
                    <div className={`${card} p-5`}>
                      <PHead icon={Ico.pump}>Gas prices</PHead>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#7a6a62]">{gas.area} average · regular</p>
                      <span className={`${display.className} text-[52px] font-extrabold leading-none text-[var(--pc-ink)]`}>${gas.grades[0].price.toFixed(2)}</span>
                      <p className={`mt-1 text-[14px] font-bold ${gas.grades[0].change > 0 ? "text-[#b3261e]" : "text-[#2e7d4f]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢ from last week</p>
                      <p className="mt-3 text-[11px] text-[#8a7a72]">U.S. Energy Information Administration · week of {gas.week}</p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* weather alerts */}
        {alerts && alerts.length > 0 && (
          <section className="pc-in pc-up mt-4 rounded-md border-l-4 border-[#b3261e] bg-[#fff4f0] p-4">
            <p className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-[#b3261e]">National Weather Service alerts in {site.state}</p>
            <ul className="grid gap-2 md:grid-cols-2">
              {alerts.map((al) => (
                <li key={al.event}><a href={al.url} target="_blank" rel="noopener" className="text-[14px] text-[#3a1c14] hover:underline"><b>{al.event}</b> — {al.area}</a></li>
              ))}
            </ul>
          </section>
        )}

        {/* three section columns, each laid out differently */}
        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-10 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[var(--pc-cu)]/25">
            {pol.length > 0 && (
              <div>
                <PHead icon={Ico.dome} link="/politics">Politics</PHead>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden rounded-sm"><Img a={pol[0]} /></span>
                  <h3 className={`${display.className} mt-3 text-[25px] font-extrabold leading-tight text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{pol[0].title}</h3>
                  {pol[0].summary && <p className="mt-1 line-clamp-3 text-[15px] text-[#5a4a42]">{pol[0].summary}</p>}
                </a>
                <ul className="mt-3 space-y-2">
                  {pol.slice(1).map((a) => (
                    <li key={a.slug} className="flex gap-2"><span className="mt-2 h-2 w-2 shrink-0 bg-[var(--pc-acc)]" /><a href={href(a)} className="text-[15px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title} <span className="text-[12px] font-normal text-[#8a7a72]">· {ago(a)}</span></a></li>
                  ))}
                </ul>
              </div>
            )}
            {biz.length > 0 && (
              <div className="lg:pl-8">
                <PHead icon={Ico.chart} link="/business">Business</PHead>
                <a href={href(biz[0])} className="group block">
                  <h3 className={`${display.className} text-[27px] font-extrabold leading-tight text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{biz[0].title}</h3>
                  {biz[0].summary && <p className="mt-2 line-clamp-3 text-[15px] text-[#5a4a42]">{biz[0].summary}</p>}
                  <span className="pc-clip pc-in pc-zoom mt-3 block aspect-[16/9] overflow-hidden rounded-sm"><Img a={biz[0]} /></span>
                </a>
                <div className="mt-3 rounded-sm bg-[#f4e9e0] p-4">
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-[.08em] text-[var(--pc-cu)]">Also in business</p>
                  {biz.slice(1).map((a) => <a key={a.slug} href={href(a)} className="block border-t border-[var(--pc-cu)]/20 py-2 text-[15px] font-semibold leading-snug text-[var(--pc-ink)] first:border-0 hover:text-[var(--pc-acc)]">{a.title}</a>)}
                </div>
              </div>
            )}
            {spo.length > 0 && (
              <div className="lg:pl-8">
                <PHead icon={Ico.trophy} link="/sports">Sports</PHead>
                <a href={href(spo[0])} className="group block">
                  <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden rounded-sm"><Img a={spo[0]} /></span>
                  <h3 className={`${display.className} mt-3 text-[25px] font-extrabold leading-tight text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{spo[0].title}</h3>
                </a>
                <ul className="mt-3 space-y-3">
                  {spo.slice(1).map((a) => (
                    <li key={a.slug}><a href={href(a)} className="group flex items-center gap-3"><span className="pc-zoom h-12 w-12 shrink-0 overflow-hidden rounded-sm"><Img a={a} /></span><span className="text-[15px] font-semibold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]">{a.title}</span></a></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      {/* The Georgia report: bento on a peach band */}
      {report.length >= 3 && (
        <section className="pc-in pc-up mt-12 bg-[linear-gradient(135deg,#f7dccf,#fbeee6_55%,#f3e2d3)] py-10">
          <div className={W}>
            <PHead icon={Ico.flame}>The {site.state} report</PHead>
            <div className="pc-stagger pc-in grid gap-4 md:grid-cols-4 md:grid-rows-2">
              {report.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`pc-card group relative block overflow-hidden rounded-md bg-[var(--pc-ink)] ${i === 0 ? "min-h-[320px] md:col-span-2 md:row-span-2 md:min-h-[480px]" : "min-h-[220px]"}`}>
                  <span className="pc-zoom absolute inset-0"><Img a={a} /></span>
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(30,12,8,.92))]" />
                  <span className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <span className="text-[11.5px] font-bold uppercase tracking-[.08em] text-[#ffc4ad]">{a.category.replace(/-/g, " ")}</span>
                    <span className={`${display.className} mt-1 block font-extrabold leading-tight text-white ${i === 0 ? "text-[28px] md:text-[36px]" : "text-[18px]"}`}>{a.title}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Life in Georgia: sideways strip on deep brown */}
      {life.length >= 3 && (
        <section className="pc-in pc-up bg-[var(--pc-ink)] py-10 text-white">
          <div className={W}>
            <PHead icon={Ico.leaf} link="/life" light>Life in {site.state}</PHead>
            <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group w-[78%] shrink-0 snap-start sm:w-[42%] lg:w-[23.5%]">
                  <span className="pc-zoom block aspect-[4/5] overflow-hidden rounded-md"><Img a={a} /></span>
                  <span className={`${display.className} mt-3 block text-[19px] font-bold leading-snug group-hover:text-[#ffc4ad]`}>{a.title}</span>
                  <span className="mt-1 block text-[12px] text-white/60">{ago(a)}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={W}>
        {/* opinion */}
        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <PHead icon={Ico.quote} link="/opinion" more="More opinion">Opinion</PHead>
            <div className="pc-stagger pc-in grid gap-6 md:grid-cols-3 md:divide-x md:divide-[var(--pc-cu)]/25">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-4 ${i > 0 ? "md:pl-6" : ""}`}>
                  <span className={`${display.className} flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--pc-acc)]/15 text-[26px] font-extrabold text-[var(--pc-acc)]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className="text-[11.5px] font-bold uppercase tracking-[.08em] text-[var(--pc-acc)]">Column</span>
                    <span className={`${display.className} block text-[19px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{a.title}</span>
                    {a.author && <span className="mt-1 block text-[13px] text-[#7a6a62]">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* safety · schools · most read */}
        {(safety.length + schools.length + mostRead.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:grid-cols-3">
            {safety.length > 0 && (
              <div className={`${card} p-5`}>
                <PHead icon={Ico.shield}>Crime &amp; safety</PHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className="block border-t border-[var(--pc-cu)]/20 py-2.5 text-[15px] font-semibold leading-snug text-[var(--pc-ink)] first:border-0 hover:text-[var(--pc-acc)]">{a.title}<span className="block text-[12px] font-normal text-[#8a7a72]">{ago(a)}</span></a>)}
              </div>
            )}
            {schools.length > 0 && (
              <div className={`${card} p-5`}>
                <PHead icon={Ico.cap}>Education</PHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className="block border-t border-[var(--pc-cu)]/20 py-2.5 text-[15px] font-semibold leading-snug text-[var(--pc-ink)] first:border-0 hover:text-[var(--pc-acc)]">{a.title}<span className="block text-[12px] font-normal text-[#8a7a72]">{ago(a)}</span></a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot rounded-md bg-[var(--pc-ink)] p-5 text-white">
                <PHead icon={Ico.flame} light>Most read</PHead>
                <ol>
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-4 border-t border-white/15 py-2.5 first:border-0">
                      <span className={`${display.className} w-8 shrink-0 text-[34px] font-black leading-none text-[var(--pc-acc)]`}>{i + 1}</span>
                      <a href={href(a)} className="text-[15px] font-semibold leading-snug hover:text-[#ffc4ad]">{a.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* lottery */}
        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-4 md:grid-cols-2">
            {lottery.map((d) => (
              <div key={d.game} className={`${card} p-5`}>
                <div className="flex items-baseline justify-between">
                  <h2 className={`${display.className} text-[22px] font-extrabold text-[var(--pc-ink)]`}>{d.game}</h2>
                  <span className="text-[12px] text-[#7a6a62]">{new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.numbers.map((n, i) => <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--pc-ink)] text-[17px] font-extrabold text-[var(--pc-ink)]">{n.replace(/^0/, "")}</span>)}
                  {d.bonus && <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--pc-acc)] text-[17px] font-extrabold text-white">{d.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-3 text-[11px] text-[#8a7a72]">From the official draw record (New York State open data). Always check your ticket with the Georgia Lottery.</p>
              </div>
            ))}
          </section>
        )}

        {/* latest grid */}
        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <PHead icon={Ico.brief} link="/local-news">Latest news</PHead>
            <div className="pc-stagger pc-in grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card pc-spot group block rounded-md bg-white p-3">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden rounded-sm"><Img a={a} /></span>
                  <span className="mt-3 block"><Kicker a={a} /></span>
                  <span className={`${display.className} mt-1 block text-[20px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{a.title}</span>
                  <span className="mt-1 block text-[12px] text-[#8a7a72]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* more headlines */}
        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <PHead icon={Ico.pin}>More from {site.state}</PHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[var(--pc-cu)]/20 py-3">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                  <a href={href(a)} className="text-[15.5px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* tip + alerts */}
        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 overflow-hidden rounded-md md:grid-cols-2">
          <div className="bg-[linear-gradient(135deg,var(--pc-ink),#5a2c1f)] p-7 text-white">
            <h2 className={`${display.className} text-[28px] font-extrabold`}>Send us a tip</h2>
            <p className="mt-2 max-w-[420px] text-[15px] text-white/85">Have a news tip, photo or document our newsroom should see? We read every message.</p>
            <a href="/contact" className="mt-4 inline-block rounded-sm bg-[var(--pc-acc)] px-5 py-2.5 text-[14px] font-bold text-white hover:brightness-110">Share a tip →</a>
          </div>
          <div className="bg-[linear-gradient(135deg,#f4c9b6,#f9e3d6)] p-7 text-[var(--pc-ink)]">
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>
      </div>

      <PeachFooter site={site} />
    </div>
  );
}
