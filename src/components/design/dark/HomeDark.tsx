import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Fire, StateOutline, UvHour } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE, srcSetOf } from "../live/shared";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import Extras from "../extras/Extras";
import StateMap from "../StateMap";
import { spectral, mont, dkOf, dkVars, DHead, DLabel, DkTopBar, DkHeader, DkFooter } from "./shared";

/**
 * Arizona homepage — "dark premium" family, from the generated Arizona mockup
 * (21.11.2026): a desert-dusk masthead, breaking line, the lead set beside
 * the cinematic Imperial slider; Today in brief, the state's own module — the
 * active wildfires on a map of Arizona (NIFC) — and the county finder; the
 * sun and heat (hourly UV index from the EPA for Phoenix), weather, gas and
 * airports; politics, business, sports; a cinematic feature, life, opinion,
 * safety / schools / most read, lottery, latest, more, tip and alerts.
 */

const SPORTS_AZ = /\b(game|coach|football|basketball|baseball|soccer|hockey|playoff|season|team|athlet|cardinals|diamondbacks|d-backs|suns|mercury|coyotes|sun devils|asu|wildcats|lumberjacks|tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|dps|jail|prison|border)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|asu|u of a|nau)\b/i;
const uvColor = (u: number) => (u >= 11 ? "#8e44ad" : u >= 8 ? "#c0392b" : u >= 6 ? "#e67e22" : u >= 3 ? "#f1c40f" : "#27ae60");
const uvWord = (u: number) => (u >= 11 ? "Extreme" : u >= 8 ? "Very high" : u >= 6 ? "High" : u >= 3 ? "Moderate" : "Low");

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-[var(--dk-deep)] to-[#2a2220]" />
  );

export default function HomeDark({
  site,
  articles,
  weather,
  counties,
  sections,
  alerts,
  gas,
  lottery,
  airports,
  fires,
  outline,
  uv,
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
  fires?: Fire[] | null;
  outline?: StateOutline | null;
  subway?: unknown;
  volcanoes?: unknown;
  buoys?: unknown;
  uv?: UvHour[] | null;
  snow?: unknown;
  drought?: unknown;
}) {
  const d = dkOf(site);
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
  const heroSlides = take(articles.heroSide.concat(articles.trending), 5).map((a) => ({ id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) }));
  const brief = take(articles.latestPosts.concat(pool), 5);
  const sec = (key: string, re: RegExp, n: number) => take((sections?.[key] || []).concat(pool.filter((a) => re.test(a.title))), n);
  const pol = sec("politics", TOPIC_RE.politics, 3);
  const biz = sec("business", TOPIC_RE.business, 3);
  const spo = sec("sports", SPORTS_AZ, 3);
  const feature = take(articles.popular.concat(pool).filter((a) => !!a.img), 1)[0];
  const life = sec("life", TOPIC_RE.life, 4);
  const opinion = take(articles.opinion, 3);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((w) => w.city === d.capital) || weather[0];
  const fl = (fires || []).filter((f) => f.lon != null && f.lat != null);
  const biggestFire = (fires || [])[0];
  const uvMax = uv && uv.length ? Math.max(...uv.map((x) => x.uv)) : null;
  const W = "mx-auto max-w-[1340px] px-4";
  const H = `${spectral.className} font-semibold leading-[1.1] text-[#f6ede6]`;
  const panel = "pc-spot border border-[var(--dk-cu)]/30 bg-[var(--dk-panel)]";
  // the shared county finder and alert box are light components; they sit on a parchment card
  const light = { ["--lv-ink" as string]: d.deep, ["--lv-acc" as string]: d.acc } as React.CSSProperties;

  return (
    <div className={`${mont.className} ${spectral.variable} min-h-screen overflow-x-hidden bg-[var(--dk-bg)] text-[#e9ddd3]`} style={dkVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <DkTopBar site={site} capital={capital} />
      <DkHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-4`}>
        <a href={href(breaking)} className="group flex items-center gap-4 border border-[var(--dk-cu)]/50 bg-[#1a1412]">
          <span className={`${spectral.className} shrink-0 bg-[var(--dk-deep)] py-2 pl-4 pr-7 text-[17px] font-semibold uppercase text-white [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)] md:text-[19px]`}>Latest</span>
          <span className={`${spectral.className} flex-1 py-2 text-[16px] leading-snug group-hover:text-[var(--dk-acc)] md:text-[19px]`}>{breaking.title} <span className="text-[13px] text-white/50">· {ago(breaking)}</span></span>
          <span className="pr-4 text-[20px] text-[var(--dk-cu)]" aria-hidden>›</span>
        </a>
      </div>

      <main className={W}>
        {/* lead beside the slider */}
        <section className="mt-5 grid items-center gap-8 lg:grid-cols-[1fr_1.7fr]">
          <a href={href(lead)} className="group block">
            <DLabel>{lead.category.replace(/-/g, " ")}</DLabel>
            <h1 className={`${H} text-[34px] md:text-[46px] group-hover:text-[var(--dk-acc)]`}><SplitWords text={lead.title} /></h1>
            {lead.summary && <p className={`${spectral.className} mt-3 text-[18px] leading-relaxed text-[#cdbfb4]`}>{lead.summary}</p>}
            <p className="mt-3 text-[13px] text-white/55">{lead.author ? `By ${lead.author} | ` : ""}{ago(lead)}</p>
            <span className="mt-4 inline-block border border-[var(--dk-cu)] bg-[var(--dk-deep)] px-4 py-2 text-[14px] font-semibold text-white">Read the full story →</span>
          </a>
          <div className="dk-hero overflow-hidden"><HeroCinema slides={heroSlides} /></div>
        </section>

        <AdSlot position="top" className="mt-8" />

        {/* brief · wildfire map · county */}
        <section className="pc-in pc-stagger mt-10 grid gap-8 lg:grid-cols-[1fr_1.3fr_1fr] lg:divide-x lg:divide-[var(--dk-cu)]/30">
          {brief.length > 0 && (
            <div>
              <DHead>Today in brief</DHead>
              <ol>
                {brief.map((a, i) => (
                  <li key={a.slug} className="flex gap-3 border-b border-white/10 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--dk-acc)] text-[13px] font-bold text-white">{i + 1}</span>
                    <span>
                      <a href={href(a)} className={`${spectral.className} block text-[16.5px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>
                      <span className="text-[12px] text-white/45">{ago(a)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {outline && fires && (
            <div className="lg:pl-8">
              <DHead>Active wildfires in {site.state}</DHead>
              <p className="-mt-2 mb-3 text-[12px] text-white/50">National Interagency Fire Center</p>
              <div className="grid items-center gap-4 sm:grid-cols-[1.3fr_1fr]">
                <div className={`${panel} p-3`}>
                  <StateMap outline={outline} fill="#3a2a22" stroke="#c0703f" label="#e9ddd3" font="var(--dk-serif), Georgia, serif"
                    cities={[["Flagstaff", 35.2, -111.65], ["Phoenix", 33.45, -112.07], ["Tucson", 32.22, -110.97], ["Yuma", 32.69, -114.63], ["Prescott", 34.54, -112.47]]}
                    points={fl.map((f) => ({ key: f.name + f.county, lon: f.lon!, lat: f.lat!, r: Math.min(16, 4 + Math.sqrt(f.acres) / 12), color: "#ff6b2c", title: `${f.name} Fire · ${f.acres.toLocaleString("en-US")} acres` }))} />
                </div>
                <div className={`${panel} p-4`}>
                  <p className="text-[14px]">Active wildfires: <b className="text-[22px] text-[#ff6b2c]">{fires.length}</b></p>
                  {biggestFire ? (
                    <p className="mt-2 text-[13.5px]">Largest: <b className="text-[#ff9b6b]">{biggestFire.name} Fire</b><br />{biggestFire.acres.toLocaleString("en-US")} acres · {biggestFire.county} County{biggestFire.contained != null ? <><br />Containment: {biggestFire.contained}%</> : null}</p>
                  ) : (
                    <p className="mt-2 text-[13.5px] text-white/70">No wildfires over 10 acres are burning in {site.state} right now.</p>
                  )}
                  <a href="https://www.nifc.gov/fire-information/nfn" target="_blank" rel="noopener" className="mt-3 inline-block border border-[var(--dk-cu)] px-3 py-1 text-[12px] font-semibold">NIFC fire news →</a>
                </div>
              </div>
            </div>
          )}
          <div className="lg:pl-8">
            <DHead>Your county</DHead>
            <div className="bg-[#f6efe9] p-4 text-[#2a1d17]" style={light}>
              <CountySearch state={site.state} counties={counties} popular={["Maricopa", "Pima", "Pinal", "Yavapai", "Coconino", "Mohave", "Yuma", "Cochise"].filter((c) => counties.includes(c))} />
            </div>
          </div>
        </section>

        {/* sun & heat · weather · gas and airports */}
        <section id="weather" className="pc-in pc-up mt-10 grid scroll-mt-4 gap-6 border-y border-[var(--dk-cu)]/30 py-8 lg:grid-cols-[1fr_1.6fr_1fr]">
          {uv && uv.length > 0 && uvMax != null && (
            <div>
              <DHead>Sun &amp; heat today</DHead>
              <p className="text-[13px] text-white/60">UV index, {d.capital} · peak <b style={{ color: uvColor(uvMax) }}>{uvMax} ({uvWord(uvMax)})</b></p>
              <div className="mt-3 flex h-[120px] items-end gap-1">
                {uv.map((x) => (
                  <div key={x.hour} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-white/60">{x.uv}</span>
                    <span className="w-full rounded-t-sm" style={{ height: `${Math.max(3, x.uv * 8)}px`, background: uvColor(x.uv) }} />
                    <span className="text-[9px] text-white/45">{x.hour.replace(/ (AM|PM)/, (m) => m.trim()[0].toLowerCase())}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-white/45">EPA UV index forecast. Above 3, wear sunscreen; above 8, avoid the midday sun.</p>
            </div>
          )}
          {weather.length > 0 && (
            <div>
              <DHead>Weather across {site.state}</DHead>
              <div className="grid grid-cols-4 gap-y-4">
                {weather.map((w) => (
                  <div key={w.city} className="text-center">
                    <p className="text-[13px] font-semibold">{w.city}</p>
                    <div className="flex justify-center"><WxIcon short={w.short} isDay={w.isDay} size={32} /></div>
                    <p className={`${spectral.className} text-[26px] font-semibold leading-none text-white`}>{w.temp}°</p>
                    {w.nextTemp != null && <p className="text-[11.5px] text-white/50">{w.nextName?.split(" ")[0]} {w.nextTemp}°</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-5">
            {gas && gas.grades[0] && (
              <div>
                <DHead>Gas prices</DHead>
                <p className={`${spectral.className} text-[44px] font-semibold leading-none text-white`}>${gas.grades[0].price.toFixed(2)}<span className="text-[18px]">/gal</span></p>
                <p className={`text-[13px] font-semibold ${gas.grades[0].change > 0 ? "text-[#ff7b6b]" : "text-[#4fd18b]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢ vs. last week</p>
                <p className="text-[11.5px] text-white/50">{gas.isRegion ? `${gas.area} average` : "State average"}, regular · EIA, week of {gas.week}</p>
              </div>
            )}
            {airports && airports.length > 0 && (
              <div>
                {airports.map((ap) => (
                  <p key={ap.code} className="flex items-center gap-2 py-0.5 text-[13.5px]" title={ap.delays.map((x) => `${x.kind}: ${x.reason}`).join("; ")}>
                    <span className={`h-2 w-2 rounded-full ${ap.delays.length ? "bg-[#ff6b5b]" : "bg-[#4fd18b]"}`} /><b>{ap.code}</b> {ap.name} <span className="ml-auto text-[12px] text-white/50">{ap.delays.length ? "delays" : "on time"}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        {alerts && alerts.length > 0 && (
          <section className="mt-6 border-l-2 border-[#ff6b2c] bg-[#22140f] px-4 py-3 text-[14px]">
            <b className="mr-3 uppercase tracking-[.14em] text-[#ff9b6b]">Weather alerts</b>
            {alerts.map((al, i) => <a key={al.event} href={al.url} target="_blank" rel="noopener" className="hover:underline">{i ? " · " : ""}<b>{al.event}</b> ({al.area})</a>)}
          </section>
        )}

        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:grid-cols-3 lg:divide-x lg:divide-[var(--dk-cu)]/30">
            {pol.length > 0 && (
              <div>
                <DHead link="/politics">Politics</DHead>
                <a href={href(pol[0])} className="group block">
                  <span className="pc-zoom block aspect-[16/10] overflow-hidden"><Img a={pol[0]} /></span>
                  <span className={`${H} mt-3 block text-[25px] group-hover:text-[var(--dk-acc)]`}>{pol[0].title}</span>
                  {pol[0].summary && <span className="mt-1 block line-clamp-2 text-[14.5px] text-white/65">{pol[0].summary}</span>}
                </a>
                {pol.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${spectral.className} mt-3 block border-t border-white/10 pt-3 text-[17px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {biz.length > 0 && (
              <div className="lg:pl-8">
                <DHead link="/business">Business</DHead>
                <a href={href(biz[0])} className="group block">
                  <span className={`${H} block text-[27px] group-hover:text-[var(--dk-acc)]`}>{biz[0].title}</span>
                  {biz[0].summary && <span className="mt-2 block line-clamp-3 text-[14.5px] text-white/65">{biz[0].summary}</span>}
                  <span className="pc-zoom mt-3 block aspect-[16/9] overflow-hidden"><Img a={biz[0]} /></span>
                </a>
                {biz.slice(1).map((a) => <a key={a.slug} href={href(a)} className="mt-3 block text-[14.5px] font-semibold leading-snug hover:text-[var(--dk-acc)]">{a.title}</a>)}
              </div>
            )}
            {spo.length > 0 && (
              <div className="lg:pl-8">
                <DHead link="/sports">Sports</DHead>
                <a href={href(spo[0])} className="group block">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={spo[0]} /></span>
                  <span className={`${H} mt-3 block text-[25px] group-hover:text-[var(--dk-acc)]`}>{spo[0].title}</span>
                </a>
                {spo.slice(1).map((a) => <a key={a.slug} href={href(a)} className={`${spectral.className} mt-3 block border-t border-white/10 pt-3 text-[17px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>)}
              </div>
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />
      </main>

      {feature && (
        <a href={href(feature)} className="pc-parallax group relative mt-14 block min-h-[520px] overflow-hidden md:min-h-[620px]">
          <span className="absolute inset-0"><Img a={feature} sizes="100vw" /></span>
          <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(18,15,14,1),rgba(18,15,14,.5)_45%,rgba(18,15,14,.15))]" />
          <span className={`${W} relative flex min-h-[inherit] flex-col justify-end pb-14`}>
            <DLabel>The big story</DLabel>
            <span className={`${spectral.className} block max-w-[820px] text-[40px] font-semibold leading-[1.05] text-white md:text-[60px]`}>{feature.title}</span>
            {feature.summary && <span className="mt-3 block max-w-[620px] text-[17px] text-white/80">{feature.summary}</span>}
          </span>
        </a>
      )}

      <div className={W}>
        {life.length >= 2 && (
          <section className="pc-in pc-up mt-12">
            <DHead link="/life" more="More life">Life in {site.state}</DHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[4/5] overflow-hidden"><Img a={a} /></span>
                  <span className={`${spectral.className} mt-2 block text-[18px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <DHead link="/opinion" more="More opinion">Opinion</DHead>
            <div className="pc-in pc-stagger grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] md:divide-x md:divide-white/10">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-4 ${i ? "md:pl-6" : ""}`}>
                  <span className={`${spectral.className} flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--dk-cu)] text-[26px] text-[var(--dk-cu)]`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    <span className={`${spectral.className} block text-[19px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
                    {a.author && <span className="text-[13px] text-white/50">By {a.author}</span>}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-6 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {safety.length > 1 && (
              <div className={`${panel} p-5`}>
                <DHead>Public safety</DHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className={`${spectral.className} block border-b border-white/10 py-2 text-[16.5px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {schools.length > 1 && (
              <div className={`${panel} p-5`}>
                <DHead>Education</DHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className={`${spectral.className} block border-b border-white/10 py-2 text-[16.5px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="pc-spot border border-[var(--dk-acc)]/50 bg-[#0f1c1d] p-5">
                <DHead>Most read</DHead>
                {mostRead.map((a, i) => (
                  <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/10 py-2.5 first:border-0">
                    <span className={`${spectral.className} w-6 text-[28px] leading-none text-[var(--dk-acc)]`}>{i + 1}</span>
                    <span className="text-[14.5px] font-semibold leading-snug hover:text-[var(--dk-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-up mt-12 grid gap-6 border-y border-[var(--dk-cu)]/30 py-6 md:grid-cols-2">
            {lottery.map((x) => (
              <div key={x.game}>
                <p className={`${spectral.className} text-[22px]`}>{x.game} <span className="text-[13px] text-white/50">· {new Date(x.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {x.numbers.map((n, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dk-cu)] text-[15px] font-semibold">{n.replace(/^0/, "")}</span>)}
                  {x.bonus && <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dk-acc)] text-[15px] font-semibold text-white">{x.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-2 text-[11px] text-white/40">Official draw record (New York State open data). Check your ticket with the Arizona Lottery.</p>
              </div>
            ))}
          </section>
        )}

        <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: d.deep, acc: d.acc, bg: d.bg, line: d.cu, text: "#e9ddd3", head: spectral.className, dark: true }} order={["numbersBand", "galleryWall", "cities"]} />

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <DHead link="/local-news" more="All the latest">Latest news</DHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                  <span className="mt-2 block"><DLabel>{a.category.replace(/-/g, " ")}</DLabel></span>
                  <span className={`${spectral.className} block text-[20px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
                  <span className="text-[12px] text-white/45">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <DHead>More from {site.state}</DHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-white/10 py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--dk-cu)]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${spectral.className} text-[16.5px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-6 border border-[var(--dk-cu)]/40 bg-[var(--dk-panel)] p-6 md:grid-cols-2 md:divide-x md:divide-[var(--dk-cu)]/30">
          <div>
            <p className={`${mont.className} text-[17px] font-semibold uppercase tracking-[.16em]`}>Send us a tip</p>
            <p className="mt-2 text-[14.5px] text-white/70">Have a news tip, photo or story idea for {site.name}? We want to hear from you.</p>
            <a href="/contact" className="mt-3 inline-block border border-[var(--dk-cu)] bg-[var(--dk-deep)] px-4 py-2 text-[14px] font-semibold">Send a tip →</a>
          </div>
          <div className="md:pl-6"><div className="bg-[#f6efe9] text-[#2a1d17]" style={light}><AlertsBox name={site.name} state={site.state} /></div></div>
        </section>
      </div>

      <DkFooter site={site} />
    </div>
  );
}
