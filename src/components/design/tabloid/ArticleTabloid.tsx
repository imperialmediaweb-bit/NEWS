import type { SiteConfig } from "@/config/site-config";
import StateBand from "../StateBand";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, DayForecast } from "@/lib/local-data";
import type { LiveArticle, LiveRelated } from "../live/ArticleLive";
import { TZ, href, hour, WxIcon } from "../live/shared";
import ShareBar from "../live/ShareBar";
import ReadingProgress from "../live/ReadingProgress";
import MobileMenu from "../live/MobileMenu";
import AlertsBox from "../live/AlertsBox";
import CountySearch from "../live/CountySearch";
import PeachFx from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf } from "@/config/state-data";
import { cond, text, tabVars, THead, Slant, TabTopBar, TabHeader, TabFooter } from "./shared";

/**
 * Florida article page — "tabloid" family: slanted section tag, a huge
 * condensed headline across the page, the italic standfirst on a coral rule,
 * byline strip, a wide photo, the story with share and progress, a sidebar
 * (latest, the coral most-read box, forecast, county, alerts) and a black
 * "Don't miss" wall at the end. Structured data stays in the route.
 */
const isStock = (url: string) => /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);

export default function ArticleTabloid({
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
  const when = published ? published.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" }) : "";
  const raw = article.content.includes("<p") ? article.content : article.content.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${p.trim()}</p>`).join("\n");
  const norm = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
  const html = raw.replace(/^\s*<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i, (m, inner) => (norm(inner) === norm(article.title) ? "" : m));
  const minutes = Math.max(1, Math.round(article.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length / 220));
  const url = `https://${site.domain}/${categorySlug}/${article.slug}`;
  const seen = new Set<string>([article.slug]);
  const pick = <T extends { slug: string }>(list: T[], n: number) => {
    const out: T[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        out.push(a);
      }
    }
    return out;
  };
  const side = pick(latest, 5);
  const top = pick(mostRead, 5);
  const wall = pick<LiveRelated>(related.concat(latest.map((a) => ({ img: a.img, title: a.title, summary: a.summary, category: a.category, date: a.date, slug: a.slug }))), 4);
  const headlines = pick(latest, 8);
  const W = "mx-auto max-w-[1360px] px-4";
  const link = (a: { category: string; slug: string }) => `/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;

  return (
    <div className={`${text.className} ${cond.variable} min-h-screen overflow-x-hidden bg-white text-[#141414]`} style={tabVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <ReadingProgress target="#tb-story" />
      <TabTopBar site={site} capital={forecast?.now} />
      <TabHeader site={site} MobileMenu={MobileMenu} active={categorySlug} />
      <StateBand site={site} categorySlug={categorySlug} />

      <div className={`${W} pt-6`}>
        <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-[#777]"><a href="/" className="hover:text-[var(--tb-acc)]">Home</a> » <a href={`/${categorySlug}`} className="hover:text-[var(--tb-acc)]">{categoryLabel}</a></nav>
        <a href={`/${categorySlug}`}><Slant>{categoryLabel}</Slant></a>
        <h1 className={`${cond.className} mt-3 max-w-[1150px] text-[40px] font-black italic leading-[.98] tracking-tight md:text-[72px]`}>{article.title}</h1>
        {article.summary && <p className="mt-4 max-w-[900px] border-l-[6px] border-[var(--tb-acc)] pl-4 text-[19px] font-medium italic leading-snug text-[#333] md:text-[23px]">{article.summary}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-y-2 border-[#111] py-3">
          <span className={`${cond.className} text-[20px] font-extrabold uppercase italic`}>By {authorName}</span>
          {authorTitle && <span className="text-[13px] text-[#666]">{authorTitle}</span>}
          <span className="text-[13px] text-[#666]">{when} · {minutes} min read</span>
          <span className="ml-auto"><ShareBar url={url} title={article.title} /></span>
        </div>
      </div>

      {article.featured_image && (
        <figure className={`${W} mt-5`}>
          <div className="pc-clip pc-in aspect-[21/9] overflow-hidden bg-[#111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.featured_image} alt={article.title} className="h-full w-full object-cover" />
          </div>
          {isStock(article.featured_image) && <figcaption className="mt-1 text-[12px] italic text-[#888]">Illustrative photo from a free stock library; it does not show the people or places in this story.</figcaption>}
        </figure>
      )}

      <div className={`${W} mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]`}>
        <article id="tb-story" className="min-w-0">
          <div className="pc-article pc-dropcap mx-auto max-w-[740px] font-serif" dangerouslySetInnerHTML={{ __html: html }} />
          <div className="mx-auto mt-8 max-w-[740px] border-t-2 border-[#111] pt-4"><ShareBar url={url} title={article.title} /></div>
          <div className="mx-auto mt-8 flex max-w-[740px] flex-wrap items-center gap-4 bg-[var(--tb-ink)] p-5 text-white">
            <p className={`${cond.className} flex-1 text-[28px] font-black uppercase italic leading-none`}>Got a tip on this story?</p>
            <a href="/submit" className={`${cond.className} bg-[var(--tb-acc)] px-5 py-2 text-[19px] font-extrabold uppercase italic`}>Tell us »</a>
          </div>
        </article>

        <aside className="space-y-6">
          <AdSlot position="side" />
          {side.length > 0 && (
            <div>
              <THead>Latest in {site.state}</THead>
              {side.map((a) => (
                <a key={a.slug} href={href(a)} className="flex gap-3 border-b border-[#e2e2e2] py-2.5">
                  <span className={`${cond.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--tb-acc)]`}>{hour(a, tz)}</span>
                  <span className="text-[15px] font-semibold leading-snug hover:text-[var(--tb-acc)]">{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {top.length > 0 && (
            <div className="bg-[var(--tb-acc)] p-5 text-white">
              <p className={`${cond.className} mb-2 text-[32px] font-black uppercase italic leading-none`}>Most read</p>
              {top.map((a, i) => (
                <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/30 py-2.5 first:border-0">
                  <span className={`${cond.className} w-7 text-[32px] font-black italic leading-none`}>{i + 1}</span>
                  <span className="text-[15px] font-bold leading-snug hover:underline">{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {forecast && (
            <div className="border-2 border-[var(--tb-ink)] p-4">
              <p className={`${cond.className} text-[26px] font-black uppercase italic leading-none`}>{forecast.city} weather</p>
              <div className="mt-2 flex items-center gap-3"><WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={46} /><span className={`${cond.className} text-[48px] font-black leading-none`}>{forecast.now.temp}°</span><span className="text-[13px] text-[#555]">{forecast.now.short}</span></div>
              <div className="mt-3 grid grid-cols-4 gap-px bg-[#ddd] text-center">
                {forecast.days.map((d) => (
                  <div key={d.name} className="bg-white py-2"><p className={`${cond.className} text-[16px] font-bold uppercase italic`}>{d.name}</p><div className="flex justify-center"><WxIcon short={d.short} isDay size={26} /></div><p className="text-[12px]">{d.high}°{d.low != null ? `/${d.low}°` : ""}</p></div>
                ))}
              </div>
            </div>
          )}
          <div className="border border-[#d9d9d9] p-4">
            <THead>Your county</THead>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange", "Duval"]).filter((c) => counties.includes(c))} />
          </div>
          <AlertsBox name={site.name} state={site.state} />
        </aside>
      </div>

      {wall.length >= 2 && (
        <section className="pc-in pc-up mt-14 bg-[#111] py-10 text-white">
          <div className={W}>
            <THead light>Don&apos;t miss</THead>
            <div className="pc-in pc-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {wall.map((a) => (
                <a key={a.slug} href={link(a)} className="pc-card group block">
                  <span className="pc-zoom block aspect-[4/3] overflow-hidden bg-[#222]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.img && <img src={a.img} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className={`${cond.className} mt-2 block text-[22px] font-extrabold leading-[1.05] group-hover:text-[var(--tb-gold)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      {headlines.length > 0 && (
        <section className={`${W} pc-in pc-up mt-10`}>
          <THead link="/local-news" more="All the latest">More from {site.state}</THead>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {headlines.map((a) => (
              <li key={a.slug} className="flex gap-4 border-b border-[#e2e2e2] py-2.5">
                <span className={`${cond.className} w-16 shrink-0 text-[16px] font-bold italic text-[var(--tb-acc)]`}>{hour(a, tz)}</span>
                <a href={href(a)} className="text-[15.5px] font-semibold leading-snug hover:text-[var(--tb-acc)]">{a.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <TabFooter site={site} />
    </div>
  );
}
