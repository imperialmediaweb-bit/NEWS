import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Quake, Fire, StateOutline } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE } from "../live/shared";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import QuakeMap, { quakeColor } from "./QuakeMap";
import { serifM, sansM, magOf, magVars, MHead, Label, MagTopBar, MagHeader, MagFooter } from "./shared";

/**
 * California homepage — "magazine" family, from the generated California
 * mockup (21.11.2026): centred masthead, breaking line, the Imperial slider
 * beside the lead story set large in serif, then Today in brief, the state's
 * own module — the past week's earthquakes on a map of California (USGS) —
 * and the county finder; wildfire watch (NIFC), weather, California's own gas
 * prices and its airports; politics, business, sports; a full-bleed feature,
 * California life, opinion, safety / schools / most read, lottery, latest,
 * more, tip and alerts. Real data only; empty modules are left out.
 */

const SPORTS_CA = /\b(game|coach|football|basketball|baseball|soccer|playoff|season|team|athlet|dodgers|giants|angels|padres|athletics|lakers|clippers|warriors|kings|sharks|ducks|49ers|niners|rams|chargers|trojans|usc|ucla|bruins|stanford|cal bears|tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|chp|jail|prison)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|uc |csu|lausd)\b/i;

const Img = ({ a, className = "" }: { a: HomeArticle; className?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[var(--mg-ink)] to-[var(--mg-acc)]" />
  );

export default function HomeMagazine({
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
}) {
  const m = magOf(site);
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
  const heroSlides = take(articles.heroSide.concat(articles.trending), 5).map((a) => ({ id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) }));
  const brief = take(articles.latestPosts.concat(pool), 5);
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 3);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", SPORTS_CA, 3);
  const feature = take(articles.popular.concat(pool).filter((a) => !!a.img), 1)[0];
  const life = sec("life", TOPIC_RE.life, 4);
  const opinion = take(articles.opinion, 4);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((w) => w.city === m.capital) || weather[0];
  const popularCounties = ["Los Angeles", "San Diego", "Orange", "Riverside", "San Bernardino", "Santa Clara", "Alameda", "Sacramento", "San Francisco", "Fresno"].filter((c) => counties.includes(c));
  const qs = quakes || [];
  const biggest = [...qs].sort((a, b) => b.mag - a.mag).slice(0, 3);
  const W = "mx-auto max-w-[1320px] px-4";
  const h = `${serifM.className} font-semibold leading-[1.1] text-[#141414]`;

  return (
    <div className={`${sansM.className} ${serifM.variable} min-h-screen overflow-x-hidden bg-white text-[#222]`} style={magVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <MagTopBar site={site} capital={capital} />
      <MagHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking line */}
      <div className={`${W} mt-4`}>
        <a href={href(breaking)} className="group flex items-center gap-4 bg-[#fbf4ea]">
          <span className={`${serifM.className} shrink-0 bg-[var(--mg-acc)] py-2 pl-4 pr-7 text-[16px] font-semibold uppercase tracking-wide text-white [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)] md:text-[19px]`}>Latest</span>
          <span className={`${serifM.className} flex-1 py-2 text-[16px] font-semibold leading-snug text-[#141414] group-hover:text-[var(--mg-acc)] md:text-[20px]`}>{breaking.title}</span>
          <span className="hidden pr-4 text-[13px] text-[#777] sm:block">{ago(breaking)} ›</span>
        </a>
      </div>

      <main className={W}>
        {/* slider + the lead story in large serif */}
        <section className="mt-6 grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="mg-hero overflow-hidden">
            <HeroCinema slides={heroSlides} />
          </div>
          <a href={href(lead)} className="group block">
            <Label>{lead.category.replace(/-/g, " ")}</Label>
            <h1 className={`${h} text-[36px] md:text-[50px]`}><SplitWords text={lead.title} /></h1>
            {lead.summary && <p className="mt-4 text-[18px] leading-relaxed text-[#444]">{lead.summary}</p>}
            <p className={`${serifM.className} mt-4 text-[15px] text-[#666]`}>{lead.author ? `By ${lead.author} | ` : ""}{ago(lead)}</p>
            <span className="mt-4 inline-block border-b-2 border-[var(--mg-acc)] pb-0.5 text-[15px] font-semibold text-[var(--mg-ink)] group-hover:text-[var(--mg-acc)]">Read the story ›</span>
          </a>
        </section>

        <AdSlot position="top" className="mt-8" />

        {/* brief · earthquakes · county */}
        <section className="pc-in pc-stagger mt-10 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[#e6ddcc]">
          {brief.length > 0 && (
            <div>
              <MHead>Today in brief</MHead>
              <ol>
                {brief.map((a, i) => (
                  <li key={a.slug} className="flex items-start gap-3 border-b border-[#eee] py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mg-acc)] text-[14px] font-bold text-white">{i + 1}</span>
                    <a href={href(a)} className="flex-1 text-[15.5px] font-semibold leading-snug hover:text-[var(--mg-acc)]">{a.title}</a>
                    <span className="shrink-0 text-[12px] text-[#888]">{ago(a)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {outline && quakes && (
            <div className="lg:pl-8">
              <MHead>Recent earthquakes</MHead>
              <p className="-mt-2 mb-2 text-[13px] text-[#777]">Past 7 days, magnitude 2.5+ · {qs.length} in {site.state} · Source: USGS</p>
              <div className="relative rounded-sm bg-[#eef4f8] p-2">
                <QuakeMap outline={outline} quakes={qs} cities={[["Los Angeles", 34.05, -118.24], ["San Francisco", 37.77, -122.42], ["Sacramento", 38.58, -121.49], ["Fresno", 36.74, -119.79], ["San Diego", 32.72, -117.16]]} />
                <div className="absolute right-3 top-3 rounded-sm bg-white/90 p-2 text-[12px] shadow-sm">
                  <p className="mb-1 font-bold">Magnitude</p>
                  {[[4.2, "4.0 +"], [3.4, "3.0 – 3.9"], [2.7, "2.5 – 2.9"]].map(([v, l]) => (
                    <p key={l as string} className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: quakeColor(v as number) }} />{l}</p>
                  ))}
                </div>
              </div>
              {biggest.length > 0 && (
                <ul className="mt-2 text-[14px]">
                  {biggest.map((q) => (
                    <li key={q.url}><a href={q.url} target="_blank" rel="noopener" className="flex gap-2 py-0.5 hover:text-[var(--mg-acc)]"><b style={{ color: quakeColor(q.mag) }}>M{q.mag.toFixed(1)}</b> {q.place} <span className="ml-auto text-[12px] text-[#888]">{new Date(q.time).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz })}</span></a></li>
                  ))}
                </ul>
              )}
              <a href="https://earthquake.usgs.gov/earthquakes/map/" target="_blank" rel="noopener" className="mt-2 inline-block text-[14px] font-semibold text-[var(--mg-ink)] hover:text-[var(--mg-acc)]">See latest earthquakes ›</a>
            </div>
          )}
          <div className="lg:pl-8">
            <MHead>Your county</MHead>
            <p className="mb-3 text-[15px] text-[#555]">The latest news, alerts and resources for your {site.state} county.</p>
            <CountySearch state={site.state} counties={counties} popular={popularCounties} />
          </div>
        </section>

        {/* wildfire watch */}
        {fires && (
          <section className="pc-in pc-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[#e6ddcc] py-4">
            <p className={`${serifM.className} text-[24px] font-semibold italic text-[var(--mg-ink)]`}>Wildfire watch</p>
            {fires.length === 0 ? (
              <p className="text-[15px] text-[#444]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#2e7d4f]" />No active wildfires over 10 acres reported in {site.state} right now.</p>
            ) : (
              fires.slice(0, 4).map((f) => (
                <p key={f.name + f.county} className="text-[15px]"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#c62828]" /><b>{f.name} Fire</b> · {f.county} County · {f.acres.toLocaleString("en-US")} acres{f.contained != null ? ` · ${f.contained}% contained` : ""}</p>
              ))
            )}
            <span className="ml-auto text-[12px] text-[#888]">National Interagency Fire Center</span>
          </section>
        )}

        {/* weather · gas · airports */}
        <section id="weather" className="pc-in pc-up mt-10 grid scroll-mt-4 gap-8 lg:grid-cols-[1.4fr_1fr] lg:divide-x lg:divide-[#e6ddcc]">
          {weather.length > 0 && (
            <div>
              <MHead>Weather across {site.state}</MHead>
              <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
                {weather.map((w) => (
                  <div key={w.city} className="px-2 text-center">
                    <p className={`${serifM.className} text-[16px] font-semibold`}>{w.city}</p>
                    <div className="flex justify-center"><WxIcon short={w.short} isDay={w.isDay} size={38} /></div>
                    <p className={`${serifM.className} text-[30px] font-semibold leading-none`}>{w.temp}°</p>
                    <p className="line-clamp-1 text-[12px] text-[#666]">{w.short}</p>
                    {w.nextName && <p className="text-[11.5px] text-[#999]">{w.nextName}: {w.nextTemp}°</p>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-[#999]">Forecasts: National Weather Service</p>
            </div>
          )}
          <div className="space-y-6 lg:pl-8">
            {gas && gas.grades[0] && (
              <div>
                <MHead>Gas prices this week</MHead>
                <div className="flex items-end gap-4">
                  <span className={`${serifM.className} text-[58px] font-semibold leading-none text-[var(--mg-ink)]`}>${gas.grades[0].price.toFixed(2)}</span>
                  <span className="pb-2 text-[15px] text-[#555]">per gallon<br /><b className={gas.grades[0].change > 0 ? "text-[#c62828]" : "text-[#2e7d4f]"}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢</b> from last week</span>
                </div>
                <p className="mt-2 text-[14px] text-[#555]">{gas.isRegion ? gas.area : "Statewide"} average, regular · {gas.grades.slice(1).map((g) => `${g.grade} $${g.price.toFixed(2)}`).join(" · ")}</p>
                <p className="mt-1 text-[12px] text-[#999]">U.S. Energy Information Administration, week of {gas.week}</p>
              </div>
            )}
            {airports && airports.length > 0 && (
              <div>
                <p className={`${serifM.className} mb-2 text-[21px] font-semibold italic text-[var(--mg-ink)]`}>At the airports</p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {airports.map((ap) => (
                    <li key={ap.code} className="flex items-center gap-2 text-[14px]" title={ap.delays.map((d) => `${d.kind}: ${d.reason}, ${d.detail}`).join("; ")}>
                      <span className={`h-2.5 w-2.5 rounded-full ${ap.delays.length ? "bg-[#c62828]" : "bg-[#2e7d4f]"}`} />
                      <b>{ap.code}</b> {ap.name} <span className="text-[12px] text-[#888]">{ap.delays.length ? ap.delays[0].kind.toLowerCase() : "on time"}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[12px] text-[#999]">FAA airport status</p>
              </div>
            )}
          </div>
        </section>

        {alerts && alerts.length > 0 && (
          <section className="mt-6 border-l-4 border-[#c62828] bg-[#fdf3f1] px-4 py-3 text-[14px]">
            <b className="mr-3 uppercase tracking-wide text-[#c62828]">Weather alerts</b>
            {alerts.map((al, i) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="hover:underline">{i > 0 ? " · " : ""}<b>{al.event}</b> ({al.area})</a>)}
          </section>
        )}

        {/* politics · business · sports */}
        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-14 grid gap-10 border-t border-[#e6ddcc] pt-8 lg:grid-cols-3 lg:divide-x lg:divide-[#e6ddcc]">
            {pol.length > 0 && (
              <div>
                <Label><a href="/politics">Politics</a></Label>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden"><Img a={pol[0]} /></span>
                  <span className={`${h} mt-3 block text-[27px] group-hover:text-[var(--mg-acc)]`}>{pol[0].title}</span>
                  {pol[0].summary && <span className="mt-2 block line-clamp-3 text-[15px] text-[#555]">{pol[0].summary}</span>}
                </a>
                {pol.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${serifM.className} mt-3 block border-t border-[#eee] pt-3 text-[18px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {biz.length > 0 && (
              <div className="lg:pl-10">
                <Label><a href="/business">Business</a></Label>
                <a href={href(biz[0])} className="group block">
                  <span className={`${h} block text-[30px] group-hover:text-[var(--mg-acc)]`}>{biz[0].title}</span>
                  {biz[0].summary && <span className="mt-2 block line-clamp-3 text-[15px] text-[#555]">{biz[0].summary}</span>}
                  <span className="pc-clip pc-in pc-zoom mt-3 block aspect-[16/9] overflow-hidden"><Img a={biz[0]} /></span>
                </a>
                {biz.slice(1).map((a) => <a key={a.slug} href={href(a)} className="mt-3 block text-[15px] font-semibold leading-snug hover:text-[var(--mg-acc)]">{a.title}</a>)}
              </div>
            )}
            {spo.length > 0 && (
              <div className="lg:pl-10">
                <Label><a href="/sports">Sports</a></Label>
                <a href={href(spo[0])} className="group block">
                  <span className="pc-clip pc-in pc-zoom block aspect-[4/3] overflow-hidden"><Img a={spo[0]} /></span>
                  <span className={`${h} mt-3 block text-[27px] group-hover:text-[var(--mg-acc)]`}>{spo[0].title}</span>
                </a>
                {spo.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${serifM.className} mt-3 block border-t border-[#eee] pt-3 text-[18px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</a>)}
              </div>
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-12" />
      </main>

      {/* full-bleed feature, magazine style */}
      {feature && (
        <a href={href(feature)} className="pc-parallax group relative mt-14 block min-h-[520px] overflow-hidden bg-[var(--mg-ink)] md:min-h-[640px]">
          <span className="absolute inset-0"><Img a={feature} /></span>
          <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,24,44,.88),rgba(8,24,44,.35)_60%,transparent)]" />
          <span className={`${W} relative flex min-h-[inherit] flex-col justify-center py-16 text-white`}>
            <span className="text-[13px] font-bold uppercase tracking-[.2em] text-[var(--mg-gold)]">The California story</span>
            <span className={`${serifM.className} mt-3 block max-w-[720px] text-[40px] font-semibold leading-[1.05] md:text-[62px]`}>{feature.title}</span>
            {feature.summary && <span className="mt-4 block max-w-[560px] text-[18px] leading-relaxed text-white/85">{feature.summary}</span>}
            <span className="mt-6 w-fit border-b-2 border-[var(--mg-acc)] pb-0.5 text-[16px] font-semibold">Read the story ›</span>
          </span>
        </a>
      )}

      <div className={W}>
        {life.length >= 2 && (
          <section className="pc-in pc-up mt-14">
            <MHead link="/life" more="More life">The California life</MHead>
            <div className="pc-in pc-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a, i) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className={`pc-zoom block overflow-hidden ${i % 2 ? "aspect-[4/5]" : "aspect-[4/3]"}`}><Img a={a} /></span>
                  <span className={`${serifM.className} mt-3 block text-[20px] font-semibold leading-snug group-hover:text-[var(--mg-acc)]`}>{a.title}</span>
                  <span className="text-[12px] text-[#888]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-14">
            <MHead link="/opinion" more="More opinion">Opinion</MHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#e6ddcc]">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-4 ${i > 0 ? "lg:pl-6" : ""}`}>
                  <span className={`${serifM.className} flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f3ede1] text-[24px] font-semibold italic text-[var(--mg-ink)]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className={`${serifM.className} block text-[18px] font-semibold leading-snug group-hover:text-[var(--mg-acc)]`}>{a.title}</span>
                    {a.author && <span className="mt-1 block text-[13px] text-[#777]">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length + schools.length + mostRead.length) > 0 && (
          <section className="pc-in pc-stagger mt-14 grid gap-10 lg:grid-cols-3">
            {safety.length > 0 && (
              <div>
                <MHead>Public safety</MHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className={`${serifM.className} block border-b border-[#eee] py-2.5 text-[18px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {schools.length > 0 && (
              <div>
                <MHead>Education</MHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className={`${serifM.className} block border-b border-[#eee] py-2.5 text-[18px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot bg-[#f7f2e8] p-6">
                <MHead>Most read</MHead>
                <ol>
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-4 border-b border-[#e6ddcc] py-2.5 last:border-0">
                      <span className={`${serifM.className} w-6 text-[30px] font-semibold italic leading-none text-[var(--mg-acc)]`}>{i + 1}</span>
                      <a href={href(a)} className="text-[15.5px] font-semibold leading-snug hover:text-[var(--mg-acc)]">{a.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-up mt-14 grid gap-8 border-y border-[#e6ddcc] py-6 md:grid-cols-2 md:divide-x md:divide-[#e6ddcc]">
            {lottery.map((d, j) => (
              <div key={d.game} className={j ? "md:pl-8" : ""}>
                <p className={`${serifM.className} text-[22px] font-semibold italic text-[var(--mg-ink)]`}>{d.game} <span className="text-[14px] not-italic text-[#888]">· {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.numbers.map((n, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mg-ink)] text-[16px] font-semibold">{n.replace(/^0/, "")}</span>)}
                  {d.bonus && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mg-acc)] text-[16px] font-semibold text-white">{d.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-2 text-[11px] text-[#999]">Official draw record (New York State open data). Check your ticket with the California Lottery.</p>
              </div>
            ))}
          </section>
        )}

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-14">
            <MHead link="/local-news" more="All the latest">Latest news</MHead>
            <div className="pc-in pc-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                  <span className="mt-3 block text-[12px] font-bold uppercase tracking-[.12em] text-[var(--mg-acc)]">{a.category.replace(/-/g, " ")}</span>
                  <span className={`${serifM.className} mt-1 block text-[22px] font-semibold leading-snug group-hover:text-[var(--mg-acc)]`}>{a.title}</span>
                  <span className="text-[12px] text-[#888]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-14">
            <MHead>More from {site.state}</MHead>
            <ul className="grid gap-x-12 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#eee] py-3">
                  <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[#999]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${serifM.className} text-[17px] font-semibold leading-snug hover:text-[var(--mg-acc)]`}>{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-14 grid scroll-mt-4 gap-6 md:grid-cols-2">
          <div className="flex flex-wrap items-center gap-5 bg-[#fbf4ea] p-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--mg-acc)]" aria-hidden><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" strokeLinejoin="round" /></svg>
            <div className="flex-1">
              <p className={`${serifM.className} text-[26px] font-semibold italic text-[var(--mg-ink)]`}>Send us a tip</p>
              <p className="text-[15px] text-[#555]">Have a story, photo or information our team should know about? We want to hear from you.</p>
            </div>
            <a href="/contact" className="border border-[var(--mg-acc)] px-4 py-2 text-[15px] font-semibold text-[var(--mg-acc)] hover:bg-[var(--mg-acc)] hover:text-white">Send a tip ›</a>
          </div>
          <div className="bg-[#eef2f7]">
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>
      </div>

      <MagFooter site={site} />
    </div>
  );
}
