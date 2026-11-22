import type { SiteConfig } from "@/config/site-config";
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
import { zilla, lora, wsOf, wsVars, WHead, WKick, WRule, WsTopBar, WsHeader, WsFooter } from "./shared";

/**
 * Montana article page — "western heritage" family (from the broadsheet layout, in Montana type and colour): section kicker, a Caslon
 * headline left-aligned, an italic deck, the byline with a dateline, the photo
 * at column width with its caption, the story opening with a bold dateline,
 * and a narrow right rail (latest, most read, forecast, county) between gold
 * rules. Structured data stays in the route.
 */
const isStock = (url: string) => /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);

export default function ArticleWestern({
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
  const b = wsOf(site);
  const tz = TZ[site.state] || "America/New_York";
  const categoryLabel = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const [authorName, authorTitle] = (article.author || "Staff Reporter").split(",").map((x) => x.trim());
  const published = article.published_at ? new Date(article.published_at) : null;
  const when = published ? published.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" }) : "";
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
  const side = pick(latest, 6);
  const top = pick(mostRead, 5);
  const row = pick<LiveRelated>(related.concat(latest.map((a) => ({ img: a.img, title: a.title, summary: a.summary, category: a.category, date: a.date, slug: a.slug }))), 4);
  const W = "mx-auto max-w-[1340px] px-4";
  const link = (a: { category: string; slug: string }) => `/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;

  return (
    <div className={`${lora.className} ${zilla.variable} min-h-screen overflow-x-hidden ws-paper text-[#1a1a1a]`} style={wsVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <ReadingProgress target="#ws-story" />
      <WsTopBar site={site} capital={forecast?.now} />
      <WsHeader site={site} MobileMenu={MobileMenu} compact active={categorySlug} />

      <div className={`${W} mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]`}>
        <article id="ws-story" className="min-w-0">
          <a href={`/${categorySlug}`}><WKick>{categoryLabel}</WKick></a>
          <h1 className={`${zilla.className} max-w-[900px] text-[36px] font-bold leading-[1.08] md:text-[50px]`}>{article.title}</h1>
          {article.summary && <p className={`${zilla.className} mt-4 max-w-[820px] text-[20px] italic leading-snug text-[#333] md:text-[23px]`}>{article.summary}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-[var(--ws-gold)] py-3 text-[14px]">
            <span><b>By {authorName}</b>{authorTitle ? <span className="text-[#666]">, {authorTitle}</span> : null}</span>
            <span className="text-[#666]">{when}</span>
            <span className="text-[#666]">{minutes} min read</span>
            <span className="ml-auto"><ShareBar url={url} title={article.title} /></span>
          </div>
          {article.featured_image && (
            <figure className="mt-6">
              <div className="pc-clip pc-in aspect-[16/9] overflow-hidden bg-[#e9e4d8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.featured_image} alt={article.title} className="h-full w-full object-cover" />
              </div>
              {isStock(article.featured_image) && <figcaption className="mt-1.5 text-[12px] text-[#777]">Illustrative photo from a free stock library; it does not show the people or places in this story.</figcaption>}
            </figure>
          )}
          <p className={`${zilla.className} mx-auto mt-8 max-w-[700px] text-[14px] font-bold tracking-[.08em]`}>{b.dateline} —</p>
          <div className={`${zilla.className} pc-article mx-auto max-w-[700px]`} dangerouslySetInnerHTML={{ __html: html }} />
          <WRule className="mx-auto mt-10 max-w-[700px]" />
          <div className="mx-auto mt-4 flex max-w-[700px] flex-wrap items-center justify-between gap-4">
            <p className={`${zilla.className} text-[18px] italic`}>Have a tip about this story? <a href="/contact" className="font-bold not-italic text-[var(--ws-acc)]">Tell our newsroom ›</a></p>
            <ShareBar url={url} title={article.title} />
          </div>
        </article>

        <aside className="space-y-8 lg:border-l lg:border-[var(--ws-gold)] lg:pl-8">
          <AdSlot position="side" />
          {side.length > 0 && (
            <div>
              <WHead>In the news</WHead>
              {side.map((a) => (
                <a key={a.slug} href={href(a)} className="block border-b border-[#e3dccb] py-2">
                  <span className="text-[12px] font-semibold text-[var(--ws-acc)]">{hour(a, tz)}</span>
                  <span className={`${zilla.className} block text-[15.5px] leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {top.length > 0 && (
            <div>
              <WHead>Most read</WHead>
              {top.map((a, i) => (
                <a key={a.slug} href={href(a)} className="flex gap-3 border-b border-[#e3dccb] py-2">
                  <span className={`${zilla.className} w-5 text-[24px] leading-none text-[var(--ws-acc)]`}>{i + 1}</span>
                  <span className="text-[14.5px] font-semibold leading-snug hover:text-[var(--ws-acc)]">{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {forecast && (
            <div>
              <WHead>{forecast.city}</WHead>
              <div className="flex items-center gap-3"><WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={40} /><span className={`${zilla.className} text-[38px] font-bold leading-none`}>{forecast.now.temp}°</span><span className="text-[13px] text-[#666]">{forecast.now.short}</span></div>
              <div className="mt-2 grid grid-cols-4 text-center">
                {forecast.days.map((d) => <div key={d.name}><p className="text-[12px] font-bold">{d.name}</p><div className="flex justify-center"><WxIcon short={d.short} isDay size={22} /></div><p className="text-[12px] text-[#666]">{d.high}°{d.low != null ? `/${d.low}°` : ""}</p></div>)}
              </div>
            </div>
          )}
          <div>
            <WHead>Your county</WHead>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Yellowstone", "Gallatin", "Missoula", "Flathead", "Cascade", "Lewis and Clark"]).filter((c) => counties.includes(c))} />
          </div>
          <AlertsBox name={site.name} state={site.state} />
        </aside>
      </div>

      {row.length > 0 && (
        <section className={`${W} pc-in pc-up mt-14 border-t-[3px] border-[#0a0a0a] pt-5`}>
          <WHead>More from {site.state}</WHead>
          <div className="pc-in pc-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {row.map((a) => (
              <a key={a.slug} href={link(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden bg-[#e9e4d8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {a.img && <img src={a.img} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <span className={`${zilla.className} mt-2 block text-[18px] font-bold leading-snug group-hover:text-[var(--ws-acc)]`}>{a.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <WsFooter site={site} />
    </div>
  );
}
