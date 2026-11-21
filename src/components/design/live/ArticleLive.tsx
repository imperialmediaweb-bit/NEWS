import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, DayForecast } from "@/lib/local-data";
import { serif, sans, TZ, href, hour, WxIcon, NAV, liveVars, LiveTopBar, LiveFooter } from "./shared";
import ShareBar from "./ShareBar";

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
}: {
  site: SiteConfig;
  article: LiveArticle;
  categorySlug: string;
  related: LiveRelated[];
  latest: HomeArticle[];
  mostRead: HomeArticle[];
  forecast: { city: string; now: CityWeather; days: DayForecast[] } | null;
}) {
  const tz = TZ[site.state] || "America/New_York";
  const categoryLabel = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const [authorName, authorTitle] = (article.author || "Staff Reporter").split(",").map((x) => x.trim());
  const published = article.published_at ? new Date(article.published_at) : null;
  const when = published
    ? `${published.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: tz })} at ${published.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" })}`
    : "";
  const html = article.content.includes("<p") ? article.content : article.content.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${p.trim()}</p>`).join("\n");
  const words = article.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  const url = `https://${site.domain}/${categorySlug}/${article.slug}`;
  const breaking = latest.find((a) => a.slug !== article.slug);
  const sideLatest = latest.filter((a) => a.slug !== article.slug).slice(0, 4);
  const top = mostRead.filter((a) => a.slug !== article.slug).slice(0, 5);
  const more = related.slice(0, 3);
  const logo = `/logos/${site.slug}.svg`;

  return (
    <div className={`${sans.className} min-h-screen bg-white text-[#1b2233]`} style={liveVars(site)}>
      <LiveTopBar site={site} capital={forecast?.now} />

      {/* compact masthead: logo left, menu right */}
      <header className="border-b border-[#dde1ea]">
        <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-4">
          <a href="/" aria-label={site.name} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={260} height={130} className="-my-3 h-[124px] w-auto" />
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
            <span className="flex shrink-0 items-center bg-[var(--lv-acc)] py-2.5 pl-4 pr-7 text-[18px] font-extrabold uppercase tracking-wide text-white [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]">
              {breaking.iso && Date.now() - new Date(breaking.iso).getTime() < 90 * 60000 ? "Breaking" : "Latest"}
            </span>
            <span className="truncate text-[17px] font-bold text-[#141b2d]">{breaking.title}</span>
            <span className="ml-auto hidden shrink-0 text-[13px] text-[#5a6275] sm:block">{hour(breaking, tz)}</span>
            <span className="hidden text-[22px] text-[#141b2d] sm:block" aria-hidden>›</span>
          </div>
        </a>
      )}

      <main className="mx-auto grid max-w-[1240px] gap-10 px-4 pt-6 lg:grid-cols-[1fr_320px]">
        <article>
          <nav className="text-[12px] font-bold uppercase tracking-wide text-[var(--lv-ink)]" aria-label="Breadcrumb">
            <a href="/" className="hover:text-[var(--lv-acc)]">Home</a> <span className="mx-1.5 text-[#8a91a3]">›</span>
            <a href={`/${categorySlug}`} className="hover:text-[var(--lv-acc)]">{categoryLabel}</a>
          </nav>
          <p className="mt-4 text-[13px] font-extrabold uppercase tracking-wider text-[var(--lv-acc)]">{site.state} · {categoryLabel}</p>
          <h1 className={`${serif.className} mt-2 text-[34px] font-extrabold leading-[1.12] text-[#141b2d] md:text-[44px]`}>{article.title}</h1>
          {article.summary && <p className="mt-3 text-[19px] leading-relaxed text-[#3a4255]">{article.summary}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#4a5266]">
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lv-ink)] text-[15px] font-bold text-white" aria-hidden>{initials(authorName || "S R")}</span>
              <span>
                By <a href={`/author/${(authorName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`} className="font-bold text-[var(--lv-ink)] hover:underline">{authorName}</a>
                <span className="block text-[12px]">{authorTitle || `${site.name} Staff`}</span>
              </span>
            </span>
            {when && <span className="border-l border-[#cfd4e0] pl-5">{when}</span>}
            <span className="border-l border-[#cfd4e0] pl-5">{minutes} min read</span>
          </div>
          <div className="mt-4"><ShareBar url={url} title={article.title} /></div>

          {article.featured_image && (
            <figure className="mt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.featured_image} alt={article.title} className="aspect-[16/9] w-full object-cover" />
              {isStockImage(article.featured_image) && (
                <figcaption className="mt-2 border-l-2 border-[#cfd4e0] pl-3 text-[13px] italic text-[#5a6275]">
                  Illustrative photo. This image is a stock photograph and does not depict the actual people, places or events described in this article.
                </figcaption>
              )}
            </figure>
          )}

          <div className={`lv-article ${serif.className} mt-6`} dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-8 border-t border-[#e3e6ee] pt-4"><ShareBar url={url} title={article.title} /></div>
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
        </aside>
      </main>

      {more.length > 0 && (
        <section className="mx-auto mt-10 max-w-[1240px] px-4">
          <h2 className={`${serif.className} flex items-center gap-2 text-[26px] font-bold text-[#141b2d]`}><span className="h-6 w-2 -skew-x-12 bg-[var(--lv-acc)]" /> More from {site.state}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {more.map((a) => (
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

      <LiveFooter site={site} />
    </div>
  );
}
