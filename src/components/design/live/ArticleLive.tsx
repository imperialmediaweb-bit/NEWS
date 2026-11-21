import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, DayForecast } from "@/lib/local-data";
import { serif, sans, TZ, href, hour, WxIcon, NAV, liveVars, LiveTopBar, LiveFooter } from "./shared";
import ShareBar from "./ShareBar";
import ReadingProgress from "./ReadingProgress";
import MobileMenu from "./MobileMenu";
import AlertsBox from "./AlertsBox";
import CountySearch from "./CountySearch";

/**
 * "Live news" family, article page — built from the generated Texas article
 * mockup (21.11.2026): compact masthead (logo left, menu right), breaking bar,
 * breadcrumb, headline, standfirst, byline with date and reading time, share,
 * lead photo with caption, the story, share again, a sidebar with the latest
 * state stories, most read, the city's forecast and alerts, then more from
 * the state. The structured data, AMP link and canonical redirect stay in the
 * route; this only changes how the page looks.
 */
export interface LiveArticle {
  title: string;
  content: string;
  summary: string;
  category: string;
  author: string;
  featured_image: string;
  published_at: string;
  slug: string;
}
export interface LiveRelated {
  img: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  slug: string;
}

function isStockImage(url: string) {
  return /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export default function ArticleLive({
  site,
  article,
  categorySlug,
  related,
  latest,
  mostRead,
  forecast,
  counties,
}: {
  site: SiteConfig;
  article: LiveArticle;
  categorySlug: string;
  related: LiveRelated[];
  latest: HomeArticle[];
  mostRead: HomeArticle[];
  forecast: { city: string; now: CityWeather; days: DayForecast[] } | null;
  counties: string[];
}) {
  const tz = TZ[site.state] || "America/New_York";
  const categoryLabel = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const [authorName, authorTitle] = (article.author || "Staff Reporter").split(",").map((x) => x.trim());
  const published = article.published_at ? new Date(article.published_at) : null;
  const when = published
    ? `${published.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: tz })} at ${published.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" })}`
    : "";
  const raw = article.content.includes("<p") ? article.content : article.content.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${p.trim()}</p>`).join("\n");
  // Many stories open with their own headline as a heading; it is already
  // the page's h1, so the repeat is dropped.
  const norm = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
  const html = raw.replace(/^\s*<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i, (m, inner) => (norm(inner) === norm(article.title) ? "" : m));
  const words = article.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  const url = `https://${site.domain}/${categorySlug}/${article.slug}`;
  const breaking = latest.find((a) => a.slug !== article.slug);
  const sideLatest = latest.filter((a) => a.slug !== article.slug).slice(0, 4);
  const shownLatest = new Set(sideLatest.map((a) => a.slug));
  const seenTop = new Set<string>();
  const top = mostRead.filter((a) => a.slug !== article.slug && !shownLatest.has(a.slug) && !seenTop.has(a.slug) && !!seenTop.add(a.slug)).slice(0, 5);
  const shownTop = new Set(top.map((a) => a.slug));
  // Six stories at the end: the related ones first, then the latest from the state.
  const moreSlugs = new Set<string>([article.slug]);
  const more: LiveRelated[] = [];
  for (const a of related) if (!moreSlugs.has(a.slug) && more.length < 6) { moreSlugs.add(a.slug); more.push(a); }
  for (const a of latest) if (!moreSlugs.has(a.slug) && !shownLatest.has(a.slug) && !shownTop.has(a.slug) && more.length < 6) { moreSlugs.add(a.slug); more.push({ img: a.img, title: a.title, summary: a.summary, category: a.category, date: a.date, slug: a.slug }); }
  const headlines = latest.filter((a) => !moreSlugs.has(a.slug) && !shownLatest.has(a.slug) && !shownTop.has(a.slug)).slice(0, 8);
  const logo = `/logos/${site.slug}.svg`;

  return (
    <div className={`${sans.className} min-h-screen bg-white text-[#1b2233]`} style={liveVars(site)}>
      <LiveTopBar site={site} capital={forecast?.now} />

      {/* compact masthead: logo left, menu right */}
      <header className="border-b border-[#dde1ea]">
        {/* phone: menu · logo · search */}
        <div className="flex items-center justify-between px-2 py-1 md:hidden">
          <MobileMenu nav={NAV} />
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={200} height={100} className="h-[80px] w-auto" />
          </a>
          <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--lv-ink)]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg></a>
        </div>
        <div className="mx-auto hidden max-w-[1240px] items-center gap-6 px-4 md:flex">
          <a href="/" aria-label={site.name} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={260} height={130} className="h-[116px] w-auto" />
          </a>
          <span className="hidden h-16 w-px bg-[#cfd4e0] md:block" aria-hidden />
          <nav className="flex-1 overflow-x-auto">
            <ul className={`${serif.className} flex items-center gap-7 whitespace-nowrap text-[19px] font-bold text-[var(--lv-ink)]`}>
              {NAV.map(([l, h]) => (
                <li key={l}><a href={h === "#weather" ? "/#weather" : h} className="hover:text-[var(--lv-acc)]">{l}</a></li>
              ))}
            </ul>
          </nav>
          <a href="/search" aria-label="Search" className="text-[var(--lv-ink)] hover:text-[var(--lv-acc)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
          </a>
        </div>
      </header>

      {/* breaking bar */}
      {breaking && (
        <a href={href(breaking)} className="block bg-[#f1f2f6]">
          <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4">
            <span className="flex shrink-0 items-center bg-[var(--lv-acc)] py-2 pl-3 pr-6 text-[14px] md:py-2.5 md:pl-4 md:pr-7 md:text-[18px] font-extrabold uppercase tracking-wide text-white [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]">
              {breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000 ? "Breaking" : "Latest"}
            </span>
            <span className="truncate text-[14px] font-bold text-[#141b2d] md:text-[17px]">{breaking.title}</span>
            <span className="ml-auto hidden shrink-0 text-[13px] text-[#5a6275] sm:block">{hour(breaking, tz)}</span>
            <span className="hidden text-[22px] text-[#141b2d] sm:block" aria-hidden>›</span>
          </div>
        </a>
      )}

      <ReadingProgress target="#lv-story" />

      {/* headline across the full width */}
      <section className="mx-auto max-w-[1240px] px-4 pt-6 md:pt-10">
        <nav className="text-[12px] font-bold uppercase tracking-wide text-[var(--lv-ink)]" aria-label="Breadcrumb">
          <a href="/" className="hover:text-[var(--lv-acc)]">Home</a> <span className="mx-1.5 text-[#8a91a3]">›</span>
          <a href={`/${categorySlug}`} className="hover:text-[var(--lv-acc)]">{categoryLabel}</a>
        </nav>
        <div className="mt-5 flex items-center gap-3">
          <span className="h-[3px] w-10 bg-[var(--lv-acc)]" aria-hidden />
          <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[var(--lv-acc)]">{site.state} · {categoryLabel}</p>
        </div>
        <h1 className={`${serif.className} mt-3 max-w-[1000px] text-[32px] font-extrabold leading-[1.06] tracking-[-0.01em] text-[#101727] md:text-[56px]`}>{article.title}</h1>
        {article.summary && <p className={`${serif.className} mt-4 max-w-[860px] text-[19px] leading-relaxed text-[#3a4255] md:text-[23px]`}>{article.summary}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#e3e6ee] py-4 text-[13px] text-[#4a5266]">
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--lv-ink)] text-[16px] font-bold text-white ring-2 ring-[var(--lv-acc)] ring-offset-2" aria-hidden>{initials(authorName || "S R")}</span>
            <span>
              By <a href={`/author/${(authorName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`} className="font-bold text-[var(--lv-ink)] hover:underline">{authorName}</a>
              <span className="block text-[12px]">{authorTitle || `${site.name} Staff`}</span>
            </span>
          </span>
          {when && <span className="border-l border-[#cfd4e0] pl-5">{when}</span>}
          <span className="border-l border-[#cfd4e0] pl-5">{minutes} min read</span>
          <span className="w-full md:ml-auto md:w-auto"><ShareBar url={url} title={article.title} /></span>
        </div>
      </section>

      {/* lead photo, cinematic and full width */}
      {article.featured_image && (
        <figure className="mx-auto mt-6 max-w-[1240px] md:px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.featured_image} alt={article.title} className="aspect-[16/9] w-full object-cover md:aspect-[21/9]" />
          {isStockImage(article.featured_image) && (
            <figcaption className="mx-4 mt-2 border-l-2 border-[#cfd4e0] pl-3 text-[13px] italic text-[#5a6275] md:mx-0">
              Illustrative photo. This image is a stock photograph and does not depict the actual people, places or events described in this article.
            </figcaption>
          )}
        </figure>
      )}

      <main className="mx-auto grid max-w-[1240px] gap-10 px-4 pt-8 lg:grid-cols-[1fr_320px]">
        <article id="lv-story" className="lg:grid lg:grid-cols-[56px_1fr] lg:gap-6">
          {/* share rail that stays beside the story */}
          <div className="hidden lg:block">
            <div className="sticky top-8"><ShareBar url={url} title={article.title} vertical /></div>
          </div>
          <div className="max-w-[720px]">
            <div className={`lv-article lv-dropcap ${serif.className}`} dangerouslySetInnerHTML={{ __html: html }} />
            <div className="mt-8 border-t-2 border-[var(--lv-ink)] pt-4"><ShareBar url={url} title={article.title} /></div>

            {/* up next */}
            {more[0] && (
              <a href={`/${(more[0].category || "news").toLowerCase().replace(/\s+/g, "-")}/${more[0].slug}`} className="group mt-8 grid overflow-hidden bg-[var(--lv-ink)] text-white sm:grid-cols-[1fr_1.1fr]">
                {more[0].img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={more[0].img} alt="" className="aspect-[16/10] h-full w-full object-cover" loading="lazy" />
                )}
                <span className="flex flex-col justify-center p-5">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-white/70">Up next</span>
                  <span className={`${serif.className} mt-2 text-[24px] font-bold leading-tight group-hover:underline`}>{more[0].title}</span>
                  <span className="mt-3 text-[13px] font-bold uppercase text-[var(--lv-acc)] [filter:brightness(1.6)]">Read the story →</span>
                </span>
              </a>
            )}
          </div>
        </article>

        <aside className="space-y-6">
          {sideLatest.length > 0 && (
            <section className="border border-[#dde1ea] bg-[#f6f7fb] p-4">
              <h2 className={`${serif.className} flex items-center gap-2 text-[22px] font-bold text-[#141b2d]`}><span className="h-2.5 w-2.5 rounded-full bg-[var(--lv-acc)]" /> Latest in {site.state}</h2>
              <ol className="relative mt-2 border-l-2 border-[var(--lv-acc)]/30 pl-4">
                {sideLatest.map((a) => (
                  <li key={a.slug} className="relative py-2">
                    <span className="absolute -left-[22px] top-3.5 h-2.5 w-2.5 rounded-full bg-[var(--lv-acc)]" />
                    <p className="text-[12px] font-bold text-[var(--lv-acc)]">{hour(a, tz)}</p>
                    <a href={href(a)} className="text-[15px] font-semibold leading-snug hover:text-[var(--lv-acc)]">{a.title}</a>
                  </li>
                ))}
              </ol>
              <a href="/" className="mt-1 block text-[13px] font-bold text-[var(--lv-ink)] hover:underline">All {site.state} news →</a>
            </section>
          )}

          {top.length > 0 && (
            <section>
              <h2 className={`${serif.className} flex items-center gap-2 text-[24px] font-bold text-[#141b2d]`}><span className="h-5 w-2 -skew-x-12 bg-[var(--lv-acc)]" /> Most read in {site.state}</h2>
              <ol className="mt-3">
                {top.map((a, i) => (
                  <li key={a.slug} className="flex gap-4 border-b border-[#e3e6ee] py-3">
                    <span className={`${serif.className} w-6 text-[30px] font-bold leading-none text-[var(--lv-acc)]`}>{i + 1}</span>
                    <a href={href(a)} className={`${serif.className} text-[16px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {forecast && (
            <section className="bg-[var(--lv-ink)] p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className={`${serif.className} text-[20px] font-bold`}>{forecast.city} Weather</h2>
                <span className="text-[12px] text-white/75">National Weather Service</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={56} />
                <span className={`${serif.className} text-[42px] font-bold leading-none`}>{forecast.now.temp}°{forecast.now.unit}</span>
                <span className="text-[13px] leading-snug">{forecast.now.short}<br />H: {forecast.now.high ?? "–"}° L: {forecast.now.low ?? "–"}°</span>
              </div>
              <ul className="mt-3 grid grid-cols-4 divide-x divide-white/15 border-t border-white/15 pt-3 text-center text-[12px]">
                {forecast.days.map((d) => (
                  <li key={d.name} className="flex flex-col items-center gap-1">
                    <span className="font-bold">{d.name}</span>
                    <WxIcon short={d.short} isDay size={24} />
                    <span>{d.high ?? "–"}°/{d.low ?? "–"}°</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="lg:sticky lg:top-4 space-y-6">
            <AlertsBox name={site.name} state={site.state} />
            {counties.length > 0 && (
              <section className="border border-[#dde1ea] p-4">
                <h2 className="mb-3 text-[17px] font-extrabold uppercase text-[var(--lv-ink)]">Your county</h2>
                <CountySearch state={site.state} counties={counties} popular={counties.length > 10 ? counties.filter((c) => ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin"].includes(c)) : counties.slice(0, 6)} />
              </section>
            )}
          </div>
        </aside>
      </main>

      {more.length > 1 && (
        <section className="mx-auto mt-10 max-w-[1240px] px-4">
          <h2 className={`${serif.className} flex items-center gap-2 text-[26px] font-bold text-[#141b2d]`}><span className="h-6 w-2 -skew-x-12 bg-[var(--lv-acc)]" /> More from {site.state}</h2>
          <div className="mt-4 grid gap-x-6 gap-y-8 md:grid-cols-3">
            {more.slice(1).map((a) => (
              <a key={a.slug} href={`/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`} className="group block">
                {a.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.img} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                )}
                <p className="mt-2 text-[12px] font-extrabold uppercase text-[var(--lv-acc)]">{a.category.replace(/-/g, " ")}</p>
                <h3 className={`${serif.className} text-[19px] font-bold leading-snug group-hover:text-[var(--lv-acc)]`}>{a.title}</h3>
                {a.summary && <p className="mt-1 line-clamp-2 text-[14px] text-[#4a5266]">{a.summary}</p>}
                <p className="mt-1 text-[12px] text-[#6b7386]">{a.date}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {headlines.length > 0 && (
        <section className="mx-auto mt-10 max-w-[1240px] px-4">
          <div className="border-y-2 border-[var(--lv-ink)] py-4">
            <h2 className="text-[15px] font-extrabold uppercase tracking-wider text-[var(--lv-ink)]">Latest {site.state} headlines</h2>
            <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
              {headlines.map((a) => (
                <li key={a.slug} className="flex gap-3 border-b border-[#e3e6ee] py-2.5">
                  <span className="w-16 shrink-0 text-[12px] font-bold text-[var(--lv-acc)]">{hour(a, tz)}</span>
                  <a href={href(a)} className={`${serif.className} text-[16px] font-bold leading-snug hover:text-[var(--lv-acc)]`}>{a.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <LiveFooter site={site} />
    </div>
  );
}
