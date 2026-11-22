import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, SubwayLine } from "@/lib/local-data";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import MobileMenu from "../live/MobileMenu";
import HeroCinema from "../live/HeroCinema";
import { TZ, href, hour, ago, WxIcon, TOPIC_RE, srcSetOf } from "../live/shared";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, sportsReOf } from "@/config/state-data";
import Extras from "../extras/Extras";
import { caslon, pub, bsOf, bsVars, BHead, Kick, Double, BsTopBar, BsHeader, BsFooter } from "./shared";

/**
 * New York homepage — "broadsheet" family, from the generated New York
 * mockup (21.11.2026): the lead set as on a front page (headline, italic
 * deck, dateline) with the Imperial slider beside it and Today in brief; the
 * state's own module — live subway service on every line (MTA alerts) —
 * with the county finder and weather across the state; gas and airports on
 * one strip; weather alerts; politics, business, sports with datelines; the
 * Metro report, Life, opinion, safety / schools / most read, the New York
 * Lottery's draws, latest, more, tip and alerts. Real data only.
 */

const SPORTS_NY = /\b(game|coach|football|basketball|baseball|soccer|hockey|playoff|season|team|athlet|yankees|mets|knicks|nets|rangers|islanders|sabres|giants|jets|bills|liberty|nycfc|syracuse|orange|tournament|championship|win|wins|score)\b/i;
const SAFETY = /\b(police|nypd|sheriff|arrest|charged|indicted|court|judge|crash|fire|fdny|shooting|killed|death|investigat|trooper|jail|prison|rikers)\b/i;
const SCHOOL = /\b(school|student|teacher|college|universit|campus|education|graduat|suny|cuny|doe)\b/i;

/** Official MTA line colours. */
const LINE: Record<string, [string, string]> = {
  "1": ["#EE352E", "#fff"], "2": ["#EE352E", "#fff"], "3": ["#EE352E", "#fff"],
  "4": ["#00933C", "#fff"], "5": ["#00933C", "#fff"], "6": ["#00933C", "#fff"], "7": ["#B933AD", "#fff"],
  A: ["#0039A6", "#fff"], C: ["#0039A6", "#fff"], E: ["#0039A6", "#fff"],
  B: ["#FF6319", "#fff"], D: ["#FF6319", "#fff"], F: ["#FF6319", "#fff"], M: ["#FF6319", "#fff"],
  G: ["#6CBE45", "#fff"], J: ["#996633", "#fff"], Z: ["#996633", "#fff"], L: ["#A7A9AC", "#fff"],
  N: ["#FCCC0A", "#111"], Q: ["#FCCC0A", "#111"], R: ["#FCCC0A", "#111"], W: ["#FCCC0A", "#111"],
  S: ["#808183", "#fff"], SIR: ["#0039A6", "#fff"],
};
const Bullet = ({ r, size = 26 }: { r: string; size?: number }) => (
  <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold" style={{ width: size, height: size, fontSize: r.length > 1 ? size * 0.36 : size * 0.58, background: LINE[r]?.[0] || "#333", color: LINE[r]?.[1] || "#fff", fontFamily: "Helvetica, Arial, sans-serif" }}>{r}</span>
);

const Img = ({ a, className = "", sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; className?: string; sizes?: string }) =>
  a.img ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" decoding="async" />
  ) : (
    <div className="h-full w-full bg-[#e9e4d8]" />
  );

export default function HomeBroadsheet({
  site,
  articles,
  weather,
  counties,
  sections,
  alerts,
  gas,
  lottery,
  airports,
  subway,
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
  subway?: SubwayLine[] | null;
  launches?: unknown;
  quakes?: unknown;
  fires?: unknown;
  outline?: unknown;
  volcanoes?: unknown;
  buoys?: unknown;
  uv?: unknown;
  snow?: unknown;
  drought?: unknown;
}) {
  const b = bsOf(site);
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
  const spo = sec("sports", sportsReOf(site.state, SPORTS_NY), 3);
  const metro = take(articles.localNews.concat(pool), 6);
  const life = sec("life", TOPIC_RE.life, 4);
  const opinion = take(articles.opinion, 3);
  const safety = take(pool.filter((a) => SAFETY.test(a.title)), 4);
  const schools = take(pool.filter((a) => SCHOOL.test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending, pool), 5);
  const latest = take(pool, 6);
  const more = take(pool, 20);
  const breaking = brief[0] || lead;
  const capital = weather.find((w) => w.city === b.capital) || weather[0];
  const popularCounties = popularOf(site.state, ["New York", "Kings", "Queens", "Bronx", "Richmond", "Nassau", "Suffolk", "Westchester", "Erie", "Monroe"]).filter((c) => counties.includes(c));
  const troubled = (subway || []).filter((l) => l.status !== "Good service");
  const good = (subway || []).filter((l) => l.status === "Good service");
  const W = "mx-auto max-w-[1340px] px-4";
  const H = `${caslon.className} font-bold leading-[1.08] text-[#0a0a0a]`;
  const deck = `${caslon.className} italic leading-snug text-[#333]`;

  return (
    <div className={`${pub.className} ${caslon.variable} min-h-screen overflow-x-hidden bg-[#fdfcf9] text-[#1a1a1a]`} style={bsVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <BsTopBar site={site} capital={capital} />
      <BsHeader site={site} MobileMenu={MobileMenu} />

      {/* breaking */}
      <div className={`${W} mt-3`}>
        <a href={href(breaking)} className="group flex items-center gap-4 bg-[#fdf1ea]">
          <span className={`${caslon.className} shrink-0 bg-[var(--bs-acc)] py-2 pl-4 pr-7 text-[16px] font-bold uppercase text-white [clip-path:polygon(0_0,calc(100%-12px)_0,100%_50%,calc(100%-12px)_100%,0_100%)] md:text-[18px]`}>Latest news</span>
          <span className={`${caslon.className} flex-1 py-2 text-[16px] font-bold leading-snug group-hover:text-[var(--bs-acc)] md:text-[19px]`}>{breaking.title} <span className="text-[var(--bs-acc)]">• Updates ›</span></span>
          <span className="hidden pr-4 text-[12px] text-[#777] sm:block">{hour(breaking, tz)} ET</span>
        </a>
      </div>

      <main className={W}>
        {/* front page: lead · slider · brief */}
        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.25fr_300px] lg:divide-x lg:divide-[var(--bs-gold)]">
          <a href={href(lead)} className="group block">
            <h1 className={`${H} text-[36px] md:text-[44px] group-hover:text-[var(--bs-acc)]`}><SplitWords text={lead.title} /></h1>
            {lead.summary && <p className={`${deck} mt-3 text-[20px]`}>{lead.summary}</p>}
            <p className="mt-3 text-[13px] font-bold">{lead.author ? `By ${lead.author}` : site.name}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[#333]"><b>{b.dateline}</b> — {ago(lead)}. <span className="font-semibold text-[var(--bs-acc)]">Read more ›</span></p>
          </a>
          <div className="bs-hero overflow-hidden lg:pl-6"><HeroCinema slides={heroSlides} /></div>
          {brief.length > 0 && (
            <aside className="lg:pl-6">
              <BHead>Today in brief</BHead>
              <ol>
                {brief.map((a, i) => (
                  <li key={a.slug} className="flex gap-3 border-b border-[#e3dccb] py-2.5">
                    <span className={`${caslon.className} text-[24px] leading-none text-[var(--bs-acc)]`}>{i + 1}</span>
                    <a href={href(a)} className={`${caslon.className} text-[15.5px] leading-snug hover:text-[var(--bs-acc)]`}>{a.title}</a>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </section>

        <Double className="mt-8" />
        <AdSlot position="top" className="mt-6" />

        {/* subway · county · weather */}
        <section className="pc-in pc-stagger mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:divide-x lg:divide-[var(--bs-gold)]">
          {subway && (
            <div>
              <BHead>The subway right now</BHead>
              <p className="-mt-1 mb-3 text-[12px] uppercase tracking-wide text-[#777]">MTA service alerts · {troubled.length ? `${troubled.length} lines with changes` : "Good service on all lines"}</p>
              {troubled.length > 0 && (
                <ul className="divide-y divide-[#e3dccb] border-y border-[#e3dccb]">
                  {troubled.slice(0, 7).map((l) => (
                    <li key={l.route} className="flex gap-3 py-2">
                      <Bullet r={l.route} />
                      <span className="min-w-0">
                        <b className={`text-[13px] uppercase tracking-wide ${/suspend/i.test(l.status) ? "text-[#c0392b]" : /delay/i.test(l.status) ? "text-[#d35400]" : "text-[#555]"}`}>{l.status}</b>
                        <span className="block text-[13.5px] leading-snug text-[#333]">{l.text.replace(/\[([A-Z0-9]+)\]/g, "$1")}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {good.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-[#2e7d4f]">Good service</p>
                  <div className="flex flex-wrap gap-1.5">{good.map((l) => <Bullet key={l.route} r={l.route} size={24} />)}</div>
                </div>
              )}
              <a href="https://new.mta.info/alerts" target="_blank" rel="noopener" className="mt-3 inline-block text-[13px] font-semibold text-[var(--bs-acc)]">All MTA alerts ›</a>
            </div>
          )}
          <div className="lg:pl-6">
            <BHead>Your county</BHead>
            <p className={`${deck} mb-3 text-[15px]`}>Local news, alerts and resources for all {counties.length} {site.state} counties.</p>
            <CountySearch state={site.state} counties={counties} popular={popularCounties} />
          </div>
          {weather.length > 0 && (
            <div id="weather" className="scroll-mt-4 lg:pl-6">
              <BHead>Weather across {site.state}</BHead>
              <ul>
                {weather.map((w) => (
                  <li key={w.city} className="flex items-center gap-3 border-b border-[#e3dccb] py-1.5 text-[15px]">
                    <span className="flex-1">{w.city}</span>
                    <WxIcon short={w.short} isDay={w.isDay} size={24} />
                    <b className={`${caslon.className} w-12 text-right text-[17px]`}>{w.temp}°F</b>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[#888]">National Weather Service</p>
            </div>
          )}
        </section>

        {/* gas + airports strip */}
        {((gas && gas.grades[0]) || (airports && airports.length > 0)) && (
          <section className="pc-in pc-up mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-[var(--bs-gold)] py-4">
            {gas && gas.grades[0] && (
              <>
                <p className={`${caslon.className} text-[24px] italic leading-tight`}>Gas prices<br className="hidden md:block" /> this week</p>
                {gas.grades.map((g) => (
                  <div key={g.grade} className="border-l border-[#e3dccb] pl-5">
                    <p className="text-[12px] text-[#666]">{g.grade === "Regular" ? `${gas.isRegion ? gas.area : "Statewide"} average` : g.grade}</p>
                    <p className={`${caslon.className} text-[28px] font-bold leading-none`}>${g.price.toFixed(2)}<span className="text-[14px] font-normal">/gal</span></p>
                    <p className={`text-[12px] font-semibold ${g.change > 0 ? "text-[#c0392b]" : "text-[#2e7d4f]"}`}>{g.change > 0 ? "▲" : "▼"} {Math.abs(g.change * 100).toFixed(1)}¢ from last week</p>
                  </div>
                ))}
              </>
            )}
            {airports && airports.length > 0 && (
              <div className="ml-auto flex flex-wrap gap-4 border-l border-[#e3dccb] pl-5 text-[14px]">
                {airports.map((ap) => (
                  <span key={ap.code} title={ap.delays.map((d) => `${d.kind}: ${d.reason}, ${d.detail}`).join("; ")} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${ap.delays.length ? "bg-[#c0392b]" : "bg-[#2e7d4f]"}`} /><b>{ap.code}</b> <span className="text-[12px] text-[#666]">{ap.delays.length ? ap.delays[0].kind.toLowerCase() : "on time"}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {alerts && alerts.length > 0 && (
          <section className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
            <div>
              <BHead>Weather &amp; roads</BHead>
              <p className="text-[12px] uppercase tracking-wide text-[#777]">National Weather Service</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {alerts.map((al) => <li key={al.event}><a href={al.url} target="_blank" rel="noopener" className="text-[14.5px] hover:text-[var(--bs-acc)]"><b className="text-[#c0392b]">• {al.event}</b> — {al.area}</a></li>)}
            </ul>
          </section>
        )}

        {/* politics · business · sports, with datelines */}
        {(pol.length + biz.length + spo.length) > 0 && (
          <section className="pc-in pc-stagger mt-10 grid gap-8 border-t-[3px] border-[#0a0a0a] pt-5 lg:grid-cols-3 lg:divide-x lg:divide-[var(--bs-gold)]">
            {[["Politics", "/politics", pol], ["Business", "/business", biz], ["Sports", "/sports", spo]].map(([label, link, list], j) =>
              (list as HomeArticle[]).length > 0 ? (
                <div key={label as string} className={j ? "lg:pl-8" : ""}>
                  <Kick><a href={link as string}>{label as string}</a></Kick>
                  {(() => {
                    const [a, ...rest] = list as HomeArticle[];
                    return (
                      <>
                        <a href={href(a)} className="group grid grid-cols-[1fr_120px] gap-3">
                          <span>
                            <span className={`${H} block text-[24px] group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
                            {a.summary && <span className={`${deck} mt-2 block line-clamp-3 text-[15px]`}>{a.summary}</span>}
                          </span>
                          <span className="pc-zoom block aspect-[3/4] overflow-hidden"><Img a={a} /></span>
                        </a>
                        <p className="mt-2 text-[13px]"><b>{a.author ? `By ${a.author}` : b.dateline}</b> · {ago(a)} · <a href={href(a)} className="font-semibold text-[var(--bs-acc)]">Read more ›</a></p>
                        {rest.map((r) => <a key={r.slug} href={href(r)} className={`${caslon.className} mt-2 block border-t border-[#e3dccb] pt-2 text-[16px] leading-snug hover:text-[var(--bs-acc)]`}>{r.title}</a>)}
                      </>
                    );
                  })()}
                </div>
              ) : null
            )}
          </section>
        )}

        <AdSlot position="mid" className="mt-10" />

        {/* the Metro report */}
        {metro.length >= 3 && (
          <section className="pc-in pc-up mt-10">
            <BHead link="/local-news" more="All local news">The Metro report</BHead>
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <a href={href(metro[0])} className="group block">
                <span className="pc-clip pc-in pc-zoom block aspect-[16/9] overflow-hidden"><Img a={metro[0]} sizes="100vw" /></span>
                <span className={`${H} mt-3 block text-[30px] group-hover:text-[var(--bs-acc)]`}>{metro[0].title}</span>
                {metro[0].summary && <span className={`${deck} mt-2 block text-[17px]`}>{metro[0].summary}</span>}
              </a>
              <ul className="pc-in pc-stagger divide-y divide-[#e3dccb]">
                {metro.slice(1).map((a) => (
                  <li key={a.slug}>
                    <a href={href(a)} className="group flex gap-4 py-3">
                      <span className="pc-zoom h-[72px] w-[108px] shrink-0 overflow-hidden"><Img a={a} /></span>
                      <span>
                        <span className={`${caslon.className} block text-[17px] font-bold leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
                        <span className="text-[12px] text-[#777]">{ago(a)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {opinion.length > 0 && (
          <section className="pc-in pc-up mt-12 border-y border-[var(--bs-gold)] py-6">
            <div className="grid gap-6 lg:grid-cols-[160px_1fr_1fr_1fr] lg:divide-x lg:divide-[#e3dccb]">
              <p className={`${caslon.className} text-[34px] italic leading-none`}>Opinion</p>
              {opinion.map((a) => (
                <a key={a.slug} href={href(a)} className="group flex gap-3 lg:pl-6">
                  <span className={`${caslon.className} flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#efe9dc] text-[20px] italic`}>{(a.author || site.name).trim().charAt(0)}</span>
                  <span>
                    {a.author && <span className="block text-[12px] font-bold uppercase tracking-wide text-[var(--bs-acc)]">{a.author}</span>}
                    <span className={`${caslon.className} block text-[17px] italic leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title} ›</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {life.length >= 2 && (
          <section className="pc-in pc-up mt-12">
            <BHead link="/life" more="More life">Life in {site.state}</BHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {life.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={a} /></span>
                  <span className={`${caslon.className} mt-2 block text-[18px] font-bold leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {(safety.length > 1 || schools.length > 1 || mostRead.length > 0) && (
          <section className="pc-in pc-stagger mt-12 grid gap-8 lg:[grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] lg:divide-x lg:divide-[var(--bs-gold)]">
            {safety.length > 1 && (
              <div>
                <BHead>Crime &amp; justice</BHead>
                {safety.map((a) => <a key={a.slug} href={href(a)} className={`${caslon.className} block border-b border-[#e3dccb] py-2 text-[16px] leading-snug hover:text-[var(--bs-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {schools.length > 1 && (
              <div className="lg:pl-8">
                <BHead>Education</BHead>
                {schools.map((a) => <a key={a.slug} href={href(a)} className={`${caslon.className} block border-b border-[#e3dccb] py-2 text-[16px] leading-snug hover:text-[var(--bs-acc)]`}>{a.title}</a>)}
              </div>
            )}
            {mostRead.length > 0 && (
              <div className="lg:pl-8">
                <BHead>Most read</BHead>
                <ol>
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-3 border-b border-[#e3dccb] py-2">
                      <span className={`${caslon.className} w-6 text-[26px] leading-none text-[var(--bs-acc)]`}>{i + 1}</span>
                      <a href={href(a)} className="text-[15px] font-semibold leading-snug hover:text-[var(--bs-acc)]">{a.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {lottery && lottery.length > 0 && (
          <section className="pc-in pc-up mt-12 border-y border-[var(--bs-gold)] py-5">
            <div className="grid gap-6 md:grid-cols-[220px_1fr_1fr]">
              <p className={`${caslon.className} text-[26px] italic leading-tight`}>{site.state} Lottery<br /><span className="text-[13px] not-italic text-[#777]">Latest draws</span></p>
              {lottery.map((d) => (
                <div key={d.game}>
                  <p className="text-[14px] font-bold">{d.game} <span className="font-normal text-[#777]">· {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span></p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {d.numbers.map((n, i) => <span key={i} className={`${caslon.className} flex h-9 w-9 items-center justify-center rounded-full border border-[#0a0a0a] text-[15px] font-bold`}>{n.replace(/^0/, "")}</span>)}
                    {d.bonus && <span className={`${caslon.className} flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bs-acc)] text-[15px] font-bold text-white`}>{d.bonus.replace(/^0/, "")}</span>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#888]">From the New York State open data record of official draws. Always check your ticket with the New York Lottery.</p>
          </section>
        )}

        <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: "#1a1a1a", acc: b.acc, bg: "#fdfcf9", line: b.gold, text: "#1a1a1a", head: caslon.className }} order={["weekColumns", "cities", "numbersTickets"]} />

        {latest.length >= 3 && (
          <section className="pc-in pc-up mt-12">
            <BHead link="/local-news" more="All the latest">Latest news</BHead>
            <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((a) => (
                <a key={a.slug} href={href(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                  <span className="mt-2 block"><Kick>{a.category.replace(/-/g, " ")}</Kick></span>
                  <span className={`${caslon.className} block text-[20px] font-bold leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
                  <span className="text-[12px] text-[#777]">{ago(a)}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section className="pc-in pc-up mt-12">
            <BHead>More from {site.state}</BHead>
            <ul className="grid gap-x-10 md:grid-cols-2">
              {more.map((a) => (
                <li key={a.slug} className="flex gap-4 border-b border-[#e3dccb] py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--bs-acc)]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${caslon.className} text-[16px] leading-snug hover:text-[var(--bs-acc)]`}>{a.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="alerts" className="pc-in pc-up mt-12 grid scroll-mt-4 gap-6 md:grid-cols-2 md:divide-x md:divide-[var(--bs-gold)]">
          <div className="bg-[#f7f1e6] p-6">
            <p className={`${caslon.className} text-[30px] italic`}>Send us a tip</p>
            <p className="mt-1 text-[15px] text-[#444]">Have a news tip, document or story idea about {site.state}? Our newsroom wants to hear from you.</p>
            <a href="/contact" className="mt-3 inline-block border-2 border-[var(--bs-acc)] px-4 py-2 text-[15px] font-semibold text-[var(--bs-acc)] hover:bg-[var(--bs-acc)] hover:text-white">Send a tip securely ›</a>
          </div>
          <div className="md:pl-6"><AlertsBox name={site.name} state={site.state} /></div>
        </section>
      </main>

      <BsFooter site={site} />
    </div>
  );
}
