import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, Storm, WeatherAlert, GasPrices, LotteryDraw, AirportStatus, Launch } from "@/lib/local-data";
import CountySearch from "./CountySearch";
import AlertsBox from "./AlertsBox";
import MobileMenu from "./MobileMenu";
import HeroCinema from "./HeroCinema";
import Reveal from "./Reveal";
import Extras from "../extras/Extras";
import PeachFx from "../peach/PeachFx";
import { serif, sans, PALETTE, TZ, href, hour, ago, WxIcon, SectionTitle, NAV, LiveTopBar, LiveFooter } from "./shared";

/**
 * "Live news" family — built from the generated Texas mockup (21.11.2026):
 * slim weather bar, centred logo, red breaking bar, lead story with a live
 * column, a row of brief / local module / counties, the state's weather,
 * three section blocks laid out differently, opinion, the tip box, footer.
 * Every module shows real data or is left out.
 */

export default function HomeLive({
  site,
  articles,
  weather,
  storms,
  counties,
  sections,
  alerts,
  gas,
  lottery,
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
}) {
  const pal = PALETTE[site.slug] || { ink: "#14213d", acc: site.accent };
  const tz = TZ[site.state] || "America/New_York";
  const lead = articles.heroMain!;
  const used = new Set<string>([lead.slug]);
  const take = (list: HomeArticle[], n: number) => {
    const out: HomeArticle[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      if (!used.has(a.slug)) {
        used.add(a.slug);
        out.push(a);
      }
    }
    return out;
  };
  const live = take(articles.latestPosts.concat(articles.heroSide), 6);
  const pool = articles.pool || articles.latestPosts;
  const brief = take(articles.trending.concat(articles.popular, articles.localNews, pool), 5);
  const opinion = take(articles.opinion, 4);
  // Three section blocks. The pipeline files nearly every story under
  // local-news, so the tagged sections are usually empty; stories are grouped
  // by what their headline is about instead, and a block appears only when it
  // has at least two stories that really belong in it.
  const TOPICS: Array<[string, RegExp, HomeArticle[]]> = [
    ["Politics", /\b(governor|gov\.|abbott|senat|legislat|lawmaker|congress|election|vote|voter|ballot|mayor|council|commissioner|statehouse|capitol|campaign|republican|democrat|policy|bill)\b/i, articles.politics],
    ["Business", /\b(business|compan|jobs?|hiring|layoff|plant|factory|econom|market|price|sales|retail|store|restaurant|opens?|opening|invest|startup|bank|oil|energy|tax|budget|million|billion)\b/i, articles.business],
    ["Sports", /\b(game|coach|football|basketball|baseball|soccer|playoff|season|team|athlet|longhorns|aggies|cowboys|texans|rangers|astros|mavericks|spurs|rockets|isd football|tournament|championship|win|wins|score)\b/i, articles.sports],
    ["Crime & Safety", /\b(police|sheriff|deput|arrest|charged|indicted|court|judge|crash|fire|shooting|killed|death|investigat|trooper|jail|prison|execution)\b/i, []],
    ["Education", /\b(school|isd|student|teacher|college|universit|campus|education|graduat)\b/i, []],
  ];
  // As in the mockup, always Politics, Business and Sports. Stories filed
  // under those categories come first; until there are enough, stories whose
  // headline is about the subject fill the block.
  const heroSlides = [lead, ...articles.heroSide].filter((a, i, arr) => a && arr.findIndex((b) => b.slug === a.slug) === i).slice(0, 5).map((a) => {
    used.add(a.slug);
    return { id: a.slug, image: a.img, title: a.title, subtitle: a.summary, eyebrow: a.category.replace(/-/g, " ").toUpperCase(), href: href(a) };
  });
  const topStories = take(pool, 4);
  // Full-width section rows, from each section's own stories.
  const secPol = take(sections?.politics || [], 6);
  const secSpo = take(sections?.sports || [], 5);
  const secBiz = take(sections?.business || [], 3);
  const secLife = take(sections?.life || [], 5);
  // Further down the page, all from the same recent pool, never repeating.
  const latestGrid = take(pool, 6);
  const CITY_BLOCKS = ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"];
  const cities: Array<[string, HomeArticle[]]> = [];
  for (const c of CITY_BLOCKS) {
    if (cities.length >= 4) break;
    const re = new RegExp(`\\b${c}\\b`, "i");
    const list = take(pool.filter((a) => re.test(a.title) || re.test(a.summary)), 3);
    if (list.length >= 2) cities.push([c, list]);
  }
  const safety = take(pool.filter((a) => TOPICS[3][1].test(a.title)), 4);
  const education = take(pool.filter((a) => TOPICS[4][1].test(a.title)), 4);
  const mostRead = take(articles.popular.concat(articles.trending), 5);
  const moreNews = take(pool, 20);
  const breaking = live[0] || lead;
  const capital = weather[0];
  const popularCounties = ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin", "Denton", "El Paso", "Hidalgo", "Lubbock"].filter((c) => counties.includes(c));
  const logo = `/logos/${site.slug}.svg`;
  const nav = NAV;

  return (
    <div className={`${sans.className} min-h-screen overflow-x-hidden bg-white text-[#1b2233]`} style={{ ["--lv-ink" as string]: pal.ink, ["--lv-acc" as string]: pal.acc }}>
      <PeachFx />
      <LiveTopBar site={site} capital={capital} />
      {/* masthead */}
      <header className="border-b border-[#dde1ea]">
        {/* phone: menu · logo · search */}
        <div className="flex items-center justify-between px-2 py-1 md:hidden">
          <MobileMenu nav={NAV} />
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={200} height={100} className="h-[88px] w-auto" />
          </a>
          <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--lv-ink)]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg></a>
        </div>
        <div className="mx-auto hidden max-w-[1400px] px-4 pt-1 text-center md:block">
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={320} height={160} className="mx-auto h-[160px] w-auto" />
          </a>
        </div>
        <nav className="hidden border-t border-[#dde1ea] md:block">
          <ul className="mx-auto flex max-w-[1400px] items-center justify-center gap-2 px-4 text-[18px] font-bold text-[var(--lv-ink)]">
            {nav.map(([l, h], i) => (
              <li key={l} className="flex items-center">
                {i > 0 && <span className="mx-5 h-5 w-px bg-[#cfd4e0]" aria-hidden />}
                <a href={h} className="block whitespace-nowrap py-3 hover:text-[var(--lv-acc)]">{l}</a>
              </li>
            ))}
            <li className="ml-6"><a href="/search" aria-label="Search" className="block py-3 hover:text-[var(--lv-acc)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg></a></li>
          </ul>
        </nav>
      </header>

      {/* breaking bar */}
      <a href={href(breaking)} className="block bg-[var(--lv-acc)] text-white">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2 md:gap-4 md:py-3">
          <span className="relative -my-2 -ml-4 flex shrink-0 items-center bg-[#8f0a24] py-2 pl-4 pr-6 text-[15px] md:-my-3 md:py-3 md:pr-7 md:text-[22px] font-extrabold uppercase tracking-wide [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]">
            {breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000 ? "Breaking" : "Latest"}
          </span>
          <span className="truncate text-[15px] font-bold md:text-[20px]">{breaking.title}</span>
          <span className="ml-auto hidden shrink-0 items-center gap-2 border-l border-white/40 pl-4 text-[18px] font-bold uppercase sm:flex"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> Live <span aria-hidden className="ml-2 text-[22px]">›</span></span>
        </div>
      </a>

      {/* cinematic hero: the day's top stories (Imperial Design System slider) */}
      <HeroCinema slides={heroSlides} />
      <Reveal />

      <main className="mx-auto max-w-[1400px] px-4">
        {/* lead + live column */}
        {/* brief · local module · counties */}
        <section className="lv-reveal mt-6 grid gap-5 md:grid-cols-3">
          <aside className="border border-[#dde1ea] border-t-4 border-t-[var(--lv-acc)] bg-[#f6f7fb] p-4">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold uppercase text-[var(--lv-acc)]"><span className="h-2.5 w-2.5 rounded-full bg-[var(--lv-acc)]" /> Live updates</h2>
            <p className="mb-2 text-[13px] text-[#5a6275]">{site.state} stories as they publish</p>
            <ol className="relative border-l-2 border-[var(--lv-acc)]/30 pl-4">
              {live.map((a) => (
                <li key={a.slug} className="relative py-2">
                  <span className="absolute -left-[22px] top-3.5 h-2.5 w-2.5 rounded-full bg-[var(--lv-acc)]" />
                  <p className="text-[12px] font-bold text-[var(--lv-acc)]">{hour(a, tz)}</p>
                  <a href={href(a)} className="text-[15px] font-semibold leading-snug text-[#141b2d] hover:text-[var(--lv-acc)]">{a.title}</a>
                </li>
              ))}
            </ol>
            <a href="/local-news" className="mt-2 block text-right text-[12px] font-bold uppercase text-[var(--lv-ink)] hover:underline">All {site.state} news →</a>
          </aside>

          <div className="border border-[#dde1ea] p-4">
            <SectionTitle>Today in brief</SectionTitle>
            <ol className="space-y-3">
              {brief.map((a, i) => (
                <li key={a.slug} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--lv-acc)] text-[13px] font-bold text-white">{i + 1}</span>
                  <a href={href(a)} className="text-[15px] font-semibold leading-snug hover:text-[var(--lv-acc)]">{a.title}<span className="block text-[12px] font-normal text-[#6b7386]">{ago(a)}</span></a>
                </li>
              ))}
            </ol>
          </div>

          {storms && (
            <div className="overflow-hidden border border-[#dde1ea]">
              <div className="bg-[var(--lv-ink)] px-4 py-3 text-white">
                <h2 className="text-[17px] font-extrabold uppercase">Hurricane tracker</h2>
                <p className="text-[12px] text-white/75">Atlantic &amp; Gulf · National Hurricane Center</p>
              </div>
              <div className="relative">
                <a href="https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7" target="_blank" rel="noopener" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png" alt="National Hurricane Center seven-day tropical outlook for the Atlantic" className="w-full" loading="lazy" />
                </a>
                <div className="absolute inset-x-3 bottom-3 border border-white/30 bg-[#0b1a3a]/85 p-3 text-white backdrop-blur-sm">
                  {storms.storms.length === 0 ? (
                    <p className="flex items-center gap-2 text-[15px] font-bold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2e9e57] text-[12px]">✓</span> No active storms in the Atlantic or Gulf</p>
                  ) : (
                    <ul className="space-y-1 text-[14px]">
                      {storms.storms.map((st) => (
                        <li key={st.name}><b>{st.classification} {st.name}</b>{st.intensity && ` · ${st.intensity}`}{st.movement && ` · moving ${st.movement}`}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-[12px] text-white/75">7-day outlook from the National Hurricane Center</p>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[#dde1ea] border-t border-[#dde1ea] text-center text-[12px] font-bold uppercase text-[var(--lv-ink)]">
                <a href="https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7" target="_blank" rel="noopener" className="py-2 hover:bg-[#f6f7fb]">NHC outlook →</a>
                <a href="https://www.star.nesdis.noaa.gov/GOES/sector.php?sat=G19&sector=taw" target="_blank" rel="noopener" className="py-2 hover:bg-[#f6f7fb]">Satellite →</a>
                <a href="https://www.nhc.noaa.gov/cyclones/" target="_blank" rel="noopener" className="py-2 hover:bg-[#f6f7fb]">Tracker →</a>
              </div>
            </div>
          )}
        </section>

        {/* weather strip */}
        {weather.length > 0 && (
          <div className={`mt-6 grid gap-5 ${gas ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
          <section id="weather" className="border border-[#dde1ea]">
            <div className="flex items-center justify-between bg-[var(--lv-ink)] px-4 py-2.5 text-white">
              <h2 className="text-[16px] font-extrabold uppercase">Weather across {site.state}</h2>
              <a href="https://www.weather.gov/" target="_blank" rel="noopener" className="text-[12px] font-semibold hover:underline">National Weather Service →</a>
            </div>
            <ul className={`grid grid-cols-2 divide-x divide-y divide-[#e3e6ee] sm:grid-cols-4 ${gas ? "" : "lg:grid-cols-8 lg:divide-y-0"}`}>
              {weather.map((w) => (
                <li key={w.city} className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                  <span className="text-[13px] font-bold text-[var(--lv-ink)]">{w.city}</span>
                  <WxIcon short={w.short} isDay={w.isDay} />
                  <span className={`${serif.className} text-[26px] font-bold leading-none`}>{w.temp}°</span>
                  <span className="line-clamp-1 text-[11px] text-[#6b7386]">{w.short}</span>
                  {w.nextName && (
                    <span className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-[#e3e6ee] pt-1.5 text-[11px] text-[#4a5266]">
                      <WxIcon short={w.nextShort || ""} isDay={!!w.nextIsDay} size={18} />
                      <span><b className="text-[var(--lv-ink)]">{w.nextName.replace("This Afternoon", "Today")}</b> {w.nextTemp}°</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          {gas && (
            <section className="border border-[#dde1ea]">
              <div className="bg-[var(--lv-ink)] px-4 py-2.5 text-white">
                <h2 className="text-[16px] font-extrabold uppercase">Gas prices this week</h2>
              </div>
              <div className="p-4">
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#5a6275]">{gas.isRegion ? `${gas.area} average` : `${gas.area} average`}</p>
                {gas.grades[0] && (
                  <p className="mt-1 flex items-end gap-3">
                    <span className={`${serif.className} text-[44px] font-extrabold leading-none text-[var(--lv-ink)]`}>${gas.grades[0].price.toFixed(2)}</span>
                    <span className="pb-1 text-[13px] text-[#5a6275]">/gal regular</span>
                  </p>
                )}
                {gas.grades[0] && <p className={`mt-1 text-[13px] font-bold ${gas.grades[0].change > 0 ? "text-[#c62828]" : "text-[#1f7a3f]"}`}>{gas.grades[0].change > 0 ? "▲" : "▼"} {Math.abs(gas.grades[0].change * 100).toFixed(1)}¢ from last week</p>}
                <ul className="mt-3 divide-y divide-[#e3e6ee] border-t border-[#e3e6ee] text-[14px]">
                  {gas.grades.slice(1).map((g) => (
                    <li key={g.grade} className="flex justify-between py-2"><span>{g.grade}</span><b>${g.price.toFixed(2)}</b></li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-[#6b7386]">U.S. Energy Information Administration · week of {gas.week}</p>
              </div>
            </section>
          )}
          </div>
        )}

        {/* your county */}
        <section className="lv-reveal mt-6 grid items-start gap-6 bg-gradient-to-r from-[#eef2fa] to-[#f7f8fc] p-5 md:grid-cols-[1fr_2fr]">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/outline/${site.slug}.svg`} alt="" className="h-14 w-14 shrink-0" />
            <div>
              <h2 className={`${serif.className} text-[28px] font-bold text-[var(--lv-ink)]`}>Your county</h2>
              <p className="text-[14px] text-[#4a5266]">News for all {counties.length} {site.state} counties, in one place.</p>
            </div>
          </div>
          <CountySearch state={site.state} counties={counties} popular={popularCounties} />
        </section>

        {/* official weather alerts */}
        {alerts && alerts.length > 0 && (
          <section className="mt-3 border-l-4 border-[#d9480f] bg-[#fff4ec] p-4">
            <p className="text-[12px] font-extrabold uppercase tracking-wider text-[#b33d0c]">Weather alerts in effect · National Weather Service</p>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {alerts.map((a) => (
                <li key={a.event} className="text-[14px]"><b className="text-[#7a2a08]">{a.event}</b> <span className="text-[#5a4a40]">— {a.area}</span></li>
              ))}
            </ul>
            <a href={alerts[0].url} target="_blank" rel="noopener" className="mt-2 inline-block text-[12px] font-bold uppercase text-[#b33d0c] hover:underline">All alerts →</a>
          </section>
        )}

        {/* top stories */}
        {topStories.length >= 3 && (
          <section className="lv-reveal mt-10">
            <SectionTitle>Top stories</SectionTitle>
            <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {topStories.map((a) => (
                <a key={a.slug} href={href(a)} className="lv-lift lv-zoom group block overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="aspect-[3/2] w-full object-cover" loading="lazy" />
                  <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-[var(--lv-acc)]">{a.category.replace(/-/g, " ")}</p>
                  <h3 className={`${serif.className} text-[18px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</h3>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* politics row: lead left, headlines right */}
        {secPol.length >= 3 && (
          <section className="lv-reveal ml-[calc(50%-50vw)] w-screen mt-12 bg-[#eef2fa] py-10">
            <div className="mx-auto max-w-[1400px] px-4">
            <div className="mb-4 flex items-center gap-3"><h2 className="text-[22px] font-extrabold uppercase tracking-wide text-[var(--lv-ink)]"><a href="/politics" className="hover:underline">Politics</a></h2><span className="h-[2px] flex-1 bg-[var(--lv-acc)]" /></div>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <a href={href(secPol[0])} className="group relative block overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={secPol[0].img} alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16 text-white">
                  <h3 className={`${serif.className} text-[26px] font-bold leading-tight md:text-[30px]`}>{secPol[0].title}</h3>
                  <p className="mt-1 text-[13px] text-white/80">{ago(secPol[0])}</p>
                </div>
              </a>
              <ul className="divide-y divide-[#e3e6ee]">
                {secPol.slice(1, 6).map((a) => (
                  <li key={a.slug} className="flex gap-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.img} alt="" className="h-20 w-28 shrink-0 object-cover" loading="lazy" />
                    <a href={href(a)} className={`${serif.className} text-[17px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}<span className="mt-1 block font-sans text-[12px] font-normal text-[#6b7386]">{ago(a)}</span></a>
                  </li>
                ))}
              </ul>
            </div>
            </div>
          </section>
        )}

        {/* sports band */}
        {secSpo.length >= 3 && (
          <section className="lv-reveal ml-[calc(50%-50vw)] w-screen mt-12 bg-gradient-to-br from-[var(--lv-ink)] to-[#06102a] py-10 text-white">
            <div className="mx-auto max-w-[1400px] px-4">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-[22px] font-extrabold uppercase tracking-wide"><a href="/sports" className="hover:underline">{site.state} Sports</a></h2>
              <span className="h-[2px] flex-1 bg-[var(--lv-acc)]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr_1fr]">
              <a href={href(secSpo[0])} className="group block lg:row-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={secSpo[0].img} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <h3 className={`${serif.className} mt-3 text-[26px] font-bold leading-tight group-hover:underline`}>{secSpo[0].title}</h3>
                {secSpo[0].summary && <p className="mt-1 line-clamp-3 text-[14px] text-white/75">{secSpo[0].summary}</p>}
              </a>
              {secSpo.slice(1, 5).map((a) => (
                <a key={a.slug} href={href(a)} className="lv-lift lv-zoom group block overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="aspect-[16/9] w-full object-cover opacity-95" loading="lazy" />
                  <h3 className={`${serif.className} mt-2 text-[17px] font-bold leading-snug group-hover:underline`}>{a.title}</h3>
                </a>
              ))}
            </div>
            </div>
          </section>
        )}

        {/* business row: three columns */}
        {secBiz.length >= 3 && (
          <section className="lv-reveal ml-[calc(50%-50vw)] w-screen mt-12 bg-[#eef7f1] py-10">
            <div className="mx-auto max-w-[1400px] px-4">
            <div className="mb-4 flex items-center gap-3"><h2 className="text-[22px] font-extrabold uppercase tracking-wide text-[#1f6b3a]"><a href="/business" className="hover:underline">Business &amp; Economy</a></h2><span className="h-[2px] flex-1 bg-[#1f6b3a]" /></div>
            <div className="grid gap-6 md:grid-cols-3">
              {secBiz.slice(0, 3).map((a) => (
                <a key={a.slug} href={href(a)} className="group block border-t-4 border-[var(--lv-ink)] pt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="aspect-[3/2] w-full object-cover" loading="lazy" />
                  <h3 className={`${serif.className} mt-2 text-[20px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</h3>
                  {a.summary && <p className="mt-1 line-clamp-2 text-[14px] text-[#4a5266]">{a.summary}</p>}
                </a>
              ))}
            </div>
            </div>
          </section>
        )}

        {/* life & culture mosaic */}
        {secLife.length >= 4 && (
          <section className="lv-reveal ml-[calc(50%-50vw)] w-screen mt-12 bg-gradient-to-b from-[#fbf3ea] to-[#fff8f1] py-10">
            <div className="mx-auto max-w-[1400px] px-4">
            <div className="mb-4 flex items-center gap-3"><h2 className="text-[22px] font-extrabold uppercase tracking-wide text-[#c2560c]"><a href="/life" className="hover:underline">Life &amp; Culture</a></h2><span className="h-[2px] flex-1 bg-[#e8892f]" /></div>
            <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
              {secLife.slice(0, 5).map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group relative block overflow-hidden ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] ${i === 0 ? "aspect-[4/3] md:h-full" : "aspect-[4/3]"}`} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <h3 className={`${serif.className} absolute inset-x-0 bottom-0 p-3 font-bold leading-snug text-white ${i === 0 ? "text-[24px]" : "text-[15px]"}`}>{a.title}</h3>
                </a>
              ))}
            </div>
            </div>
          </section>
        )}

        {/* lottery */}
        {lottery && lottery.length > 0 && (
          <section className="lv-reveal mt-12 grid gap-5 md:grid-cols-2">
            {lottery.map((d) => (
              <div key={d.game} className="border border-[#dde1ea] p-5">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[18px] font-extrabold uppercase text-[var(--lv-ink)]">{d.game}</h2>
                  <span className="text-[12px] text-[#6b7386]">{new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {d.numbers.map((n, i) => (
                    <span key={i} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--lv-ink)] text-[17px] font-extrabold text-[var(--lv-ink)]">{n.replace(/^0/, "")}</span>
                  ))}
                  {d.bonus && <span className={`flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-extrabold text-white ${d.game === "Powerball" ? "bg-[#d32f2f]" : "bg-[#f2b705] !text-[#1b2233]"}`}>{d.bonus.replace(/^0/, "")}</span>}
                </div>
                <p className="mt-3 text-[11px] text-[#6b7386]">Winning numbers from the official draw record (New York State open data). Always check your ticket with the official lottery.</p>
              </div>
            ))}
          </section>
        )}

        {/* latest news grid */}
        <Extras site={site} pool={pool} used={used} weather={weather} gas={gas} counties={counties} theme={{ ink: pal.ink, acc: pal.acc, bg: "#ffffff", line: "#dde1ea", text: "#1b2233", head: serif.className }} />

        {latestGrid.length >= 3 && (
          <section className="lv-reveal mt-10">
            <SectionTitle href="/local-news">Latest news</SectionTitle>
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {latestGrid.map((a) => (
                <a key={a.slug} href={href(a)} className="lv-lift lv-zoom group block overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  <p className="mt-2 text-[12px] font-bold uppercase text-[var(--lv-acc)]">{ago(a)}</p>
                  <h3 className={`${serif.className} text-[20px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</h3>
                  {a.summary && <p className="mt-1 line-clamp-2 text-[14px] text-[#4a5266]">{a.summary}</p>}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* across the state, city by city */}
        {cities.length >= 2 && (
          <section className="mt-10 bg-[#f6f7fb] px-5 py-6">
            <SectionTitle>Across {site.state}</SectionTitle>
            <div className={`grid gap-6 sm:grid-cols-2 ${cities.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {cities.map(([c, list]) => (
                <div key={c}>
                  <h3 className="mb-2 border-b-2 border-[var(--lv-ink)] pb-1 text-[15px] font-extrabold uppercase tracking-wide text-[var(--lv-ink)]">{c}</h3>
                  {list[0] && (
                    <a href={href(list[0])} className="lv-lift lv-zoom group block overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={list[0].img} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                      <span className={`${serif.className} mt-2 block text-[17px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{list[0].title}</span>
                    </a>
                  )}
                  <ul className="mt-2 space-y-1.5">
                    {list.slice(1).map((a) => (
                      <li key={a.slug} className="border-t border-[#e3e6ee] pt-1.5 text-[14px] font-semibold"><a href={href(a)} className="hover:text-[var(--lv-acc)]">{a.title}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* safety · education · most read */}
        {(safety.length >= 2 || education.length >= 2 || mostRead.length >= 3) && (
          <section className="lv-reveal mt-10 grid gap-8 lg:grid-cols-3">
            {safety.length >= 2 && (
              <div>
                <SectionTitle>Crime &amp; Safety</SectionTitle>
                <ul className="space-y-3">
                  {safety.map((a, i) => (
                    <li key={a.slug} className={i === 0 ? "" : "border-t border-[#e3e6ee] pt-3"}>
                      <a href={href(a)} className={`${serif.className} block ${i === 0 ? "text-[20px]" : "text-[16px]"} font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                      <span className="text-[12px] text-[#6b7386]">{ago(a)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {education.length >= 2 && (
              <div>
                <SectionTitle>Education</SectionTitle>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={education[0].img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                <ul className="mt-2 space-y-3">
                  {education.map((a, i) => (
                    <li key={a.slug} className={i === 0 ? "" : "border-t border-[#e3e6ee] pt-3"}>
                      <a href={href(a)} className={`${serif.className} block ${i === 0 ? "text-[20px]" : "text-[16px]"} font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mostRead.length >= 3 && (
              <div className="border border-[#dde1ea] p-4">
                <SectionTitle>Most read</SectionTitle>
                <ol>
                  {mostRead.map((a, i) => (
                    <li key={a.slug} className="flex gap-4 border-b border-[#e3e6ee] py-3 last:border-0">
                      <span className={`${serif.className} w-6 text-[30px] font-bold leading-none text-[var(--lv-acc)]`}>{i + 1}</span>
                      <a href={href(a)} className={`${serif.className} text-[16px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* opinion */}
        {opinion.length > 0 && (
          <section className="lv-reveal mt-8">
            <SectionTitle href="/opinion">Opinion</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              {opinion.map((a, i) => (
                <a key={a.slug} href={href(a)} className={`group flex gap-3 ${i > 0 ? "lg:border-l lg:border-[#e3e6ee] lg:pl-5" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="h-20 w-20 shrink-0 object-cover" loading="lazy" />
                  <span>
                    <span className="block text-[11px] font-bold uppercase text-[var(--lv-acc)]">Opinion</span>
                    <span className={`${serif.className} block text-[17px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</span>
                    <span className="mt-1 block text-[12px] italic text-[#6b7386]">By {a.author}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* more news */}
        {moreNews.length > 0 && (
          <section className="lv-reveal mt-12">
            <SectionTitle href="/local-news">More from {site.state}</SectionTitle>
            <ul className="grid gap-x-8 md:grid-cols-2">
              {moreNews.map((a) => (
                <li key={a.slug} className="lv-zoom flex gap-4 overflow-hidden border-b border-[#e3e6ee] py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt="" className="h-24 w-36 shrink-0 object-cover" loading="lazy" />
                  <span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--lv-acc)]">{a.category.replace(/-/g, " ")}</span>
                    <a href={href(a)} className={`${serif.className} block text-[18px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                    <span className="mt-1 block text-[12px] text-[#6b7386]">{ago(a)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* tip + alerts */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col items-start gap-3 bg-[var(--lv-acc)] p-6 text-white sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-[20px]" aria-hidden>✉</span>
            <div>
              <h2 className="text-[20px] font-extrabold uppercase">Send us a tip</h2>
              <p className={`${serif.className} text-[16px] italic text-white/90`}>Have a news tip, document or story idea? Our newsroom wants to hear from you.</p>
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
