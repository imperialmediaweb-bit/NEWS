import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles, HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, Storm } from "@/lib/local-data";
import CountySearch from "./CountySearch";
import AlertsBox from "./AlertsBox";
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
}: {
  site: SiteConfig;
  articles: HomeArticles;
  weather: CityWeather[];
  storms: { storms: Storm[] } | null;
  counties: string[];
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
  const blocks: Array<[string, string, HomeArticle[]]> = TOPICS.slice(0, 3).map(([label, re, tagged]) => [
    label,
    "/" + label.toLowerCase(),
    take(tagged.concat(pool.filter((a) => re.test(a.title))), 4),
  ]);
  const breaking = live[0] || lead;
  const capital = weather[0];
  const popularCounties = ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin", "Denton", "El Paso", "Hidalgo", "Lubbock"].filter((c) => counties.includes(c));
  const logo = `/logos/${site.slug}.svg`;
  const nav = NAV;

  return (
    <div className={`${sans.className} min-h-screen bg-white text-[#1b2233]`} style={{ ["--lv-ink" as string]: pal.ink, ["--lv-acc" as string]: pal.acc }}>
      <LiveTopBar site={site} capital={capital} />
      {/* masthead */}
      <header className="border-b border-[#dde1ea]">
        <div className="mx-auto max-w-[1240px] px-4 py-0 text-center">
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={300} height={150} className="mx-auto -my-3 h-[176px] w-auto" />
          </a>
        </div>
        <nav className="border-t border-[#dde1ea]">
          <ul className="mx-auto flex max-w-[1240px] items-center justify-start gap-2 overflow-x-auto px-4 text-[16px] md:justify-center md:text-[18px] font-bold text-[var(--lv-ink)]">
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
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3">
          <span className="relative -my-3 -ml-4 flex shrink-0 items-center bg-[#8f0a24] py-3 pl-4 pr-7 text-[22px] font-extrabold uppercase tracking-wide [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]">
            {breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000 ? "Breaking" : "Latest"}
          </span>
          <span className="truncate text-[20px] font-bold">{breaking.title}</span>
          <span className="ml-auto hidden shrink-0 items-center gap-2 border-l border-white/40 pl-4 text-[18px] font-bold uppercase sm:flex"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" /> Live <span aria-hidden className="ml-2 text-[22px]">›</span></span>
        </div>
      </a>

      <main className="mx-auto max-w-[1240px] px-4">
        {/* lead + live column */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <a href={href(lead)} className="group relative block min-h-[420px] overflow-hidden bg-[#0d1730]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lead.img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            <div className="relative flex h-full max-w-[560px] flex-col justify-center p-7 text-white">
              <span className="mb-3 w-fit bg-[var(--lv-acc)] px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider">Top story</span>
              <h1 className={`${serif.className} text-[34px] font-extrabold leading-[1.1] md:text-[42px]`}>{lead.title}</h1>
              {lead.summary && <p className="mt-3 text-[16px] leading-relaxed text-white/90">{lead.summary}</p>}
              <p className="mt-4 text-[13px] text-white/80">By {lead.author} · {ago(lead)}</p>
            </div>
          </a>
          <aside className="border border-[#dde1ea] bg-[#f6f7fb] p-4">
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
        </section>

        {/* brief · local module · counties */}
        <section className="mt-6 grid gap-5 md:grid-cols-3">
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

          <div className="border border-[#dde1ea] p-4">
            <div className="mb-3 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/outline/${site.slug}.svg`} alt="" className="h-10 w-10 shrink-0" />
              <div>
                <h2 className="text-[19px] font-extrabold uppercase tracking-wide text-[var(--lv-ink)]">Your county</h2>
                <p className="text-[12px] text-[#5a6275]">News for all {counties.length} {site.state} counties</p>
              </div>
            </div>
            <CountySearch state={site.state} counties={counties} popular={popularCounties} />
          </div>
        </section>

        {/* weather strip */}
        {weather.length > 0 && (
          <section id="weather" className="mt-6 border border-[#dde1ea]">
            <div className="flex items-center justify-between bg-[var(--lv-ink)] px-4 py-2.5 text-white">
              <h2 className="text-[16px] font-extrabold uppercase">Weather across {site.state}</h2>
              <a href="https://www.weather.gov/" target="_blank" rel="noopener" className="text-[12px] font-semibold hover:underline">National Weather Service →</a>
            </div>
            <ul className="grid grid-cols-2 divide-x divide-y divide-[#e3e6ee] sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
              {weather.map((w) => (
                <li key={w.city} className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                  <span className="text-[13px] font-bold text-[var(--lv-ink)]">{w.city}</span>
                  <WxIcon short={w.short} isDay={w.isDay} />
                  <span className={`${serif.className} text-[26px] font-bold leading-none`}>{w.temp}°</span>
                  <span className="text-[11px] text-[#6b7386]">{w.low ?? "–"}° / {w.high ?? "–"}°</span>
                  <span className="line-clamp-1 text-[11px] text-[#6b7386]">{w.short}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* three sections, three layouts */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {blocks.map(([label, link, list], i) => list.length === 0 ? <div key={label} /> : (
            <div key={label} className={i === 1 ? "lg:border-x lg:border-[#e3e6ee] lg:px-6" : ""}>
              <SectionTitle href={link}>{label}</SectionTitle>
              {i === 1 ? (
                <>
                  <a href={href(list[0])} className="group block">
                    <h3 className={`${serif.className} text-[24px] font-bold leading-tight group-hover:text-[var(--lv-acc)]`}>{list[0].title}</h3>
                  </a>
                  {list[0].summary && <p className="mt-1 line-clamp-3 text-[14px] text-[#4a5266]">{list[0].summary}</p>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={list[0].img} alt="" className="mt-3 aspect-[16/9] w-full object-cover" loading="lazy" />
                </>
              ) : (
                <a href={href(list[0])} className="group block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={list[0].img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  <h3 className={`${serif.className} mt-2 text-[23px] font-bold leading-tight group-hover:text-[var(--lv-acc)]`}>{list[0].title}</h3>
                  {i === 0 && list[0].summary && <p className="mt-1 line-clamp-3 text-[14px] font-normal text-[#4a5266]">{list[0].summary}</p>}
                </a>
              )}
              {i === 2 ? (
                <div className="mt-3 bg-[#f6f7fb] p-3">
                  <p className="mb-2 text-[12px] font-bold uppercase text-[var(--lv-ink)]">More {label.toLowerCase().startsWith("across") ? "" : label.toLowerCase() + " "}stories</p>
                  <ul className="space-y-2">
                    {list.slice(1).map((a) => (
                      <li key={a.slug} className="flex gap-2 text-[14px] font-semibold"><span className="text-[var(--lv-acc)]">★</span><a href={href(a)} className="hover:text-[var(--lv-acc)]">{a.title}</a></li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="mt-3 space-y-2 border-t border-[#e3e6ee] pt-3">
                  {list.slice(1).map((a) => (
                    <li key={a.slug} className="flex gap-2 text-[15px] font-semibold"><span className="mt-1.5 h-2 w-2 shrink-0 bg-[var(--lv-acc)]" /><a href={href(a)} className="hover:text-[var(--lv-acc)]">{a.title}</a></li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* opinion */}
        {opinion.length > 0 && (
          <section className="mt-8">
            <SectionTitle href="/opinion">Opinion</SectionTitle>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
