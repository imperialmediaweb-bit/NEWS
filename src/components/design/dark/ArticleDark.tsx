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
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf } from "@/config/state-data";
import { spectral, mont, dkOf, dkVars, DHead, DLabel, DkTopBar, DkHeader, DkFooter } from "./shared";

/**
 * Arizona article page — "dark premium" family: the headline on black with
 * a copper rule, a letterboxed cinematic photo in a thin copper frame, the
 * story in light type on dark with a drop cap, and a right rail (latest, most
 * read, forecast, county, alerts on parchment). Structured data stays in the
 * route.
 */
const isStock = (url: string) => /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);

export default function ArticleDark({ site, article, categorySlug, related, latest, mostRead, forecast, counties }: {
  site: SiteConfig;
  article: LiveArticle;
  categorySlug: string;
  related: LiveRelated[];
  latest: HomeArticle[];
  mostRead: HomeArticle[];
  forecast: { city: string; now: CityWeather; days: DayForecast[] } | null;
  counties: string[];
}) {
  const d = dkOf(site);
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
  const row = pick<LiveRelated>(related.concat(latest.map((a) => ({ img: a.img, title: a.title, summary: a.summary, category: a.category, date: a.date, slug: a.slug }))), 3);
  const W = "mx-auto max-w-[1340px] px-4";
  const light = { ["--lv-ink" as string]: d.deep, ["--lv-acc" as string]: d.acc } as React.CSSProperties;
  const link = (a: { category: string; slug: string }) => `/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;

  return (
    <div className={`dk-root ${mont.className} ${spectral.variable} min-h-screen overflow-x-hidden bg-[var(--dk-bg)] text-[#e9ddd3]`} style={dkVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <ReadingProgress target="#dk-story" />
      <DkTopBar site={site} capital={forecast?.now} />
      <DkHeader site={site} MobileMenu={MobileMenu} compact active={categorySlug} />

      <header className={`${W} pt-10`}>
        <a href={`/${categorySlug}`}><DLabel>{categoryLabel}</DLabel></a>
        <h1 className={`${spectral.className} max-w-[1050px] text-[38px] font-semibold leading-[1.06] text-white md:text-[62px]`}><SplitWords text={article.title} /></h1>
        <span className="mt-5 block h-[2px] w-28 bg-[var(--dk-cu)]" />
        {article.summary && <p className={`${spectral.className} mt-5 max-w-[860px] text-[20px] italic leading-relaxed text-[#cdbfb4] md:text-[23px]`}>{article.summary}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/60">
          <span className="text-[14px] text-white">By <b>{authorName}</b>{authorTitle ? `, ${authorTitle}` : ""}</span>
          <span>{when}</span>
          <span>{minutes} min read</span>
          <span className="ml-auto"><ShareBar url={url} title={article.title} /></span>
        </div>
      </header>

      {article.featured_image && (
        <figure className={`${W} mt-8`}>
          <div className="pc-clip pc-in aspect-[2.39/1] overflow-hidden border border-[var(--dk-cu)]/60 p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.featured_image} alt={article.title} className="h-full w-full object-cover" />
          </div>
          {isStock(article.featured_image) && <figcaption className="mt-2 text-[12px] italic text-white/45">Illustrative photo from a free stock library; it does not show the people or places in this story.</figcaption>}
        </figure>
      )}

      <div className={`${W} mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_330px]`}>
        <article id="dk-story" className="min-w-0">
          <div className={`${spectral.className} pc-article pc-dropcap mx-auto max-w-[720px]`} dangerouslySetInnerHTML={{ __html: html }} />
          <div className="mx-auto mt-10 flex max-w-[720px] flex-wrap items-center justify-between gap-4 border-t border-[var(--dk-cu)]/40 pt-5">
            <p className={`${spectral.className} text-[18px] italic text-white/70`}>Know more? <a href="/contact" className="not-italic text-[var(--dk-acc)]">Send our newsroom a tip →</a></p>
            <ShareBar url={url} title={article.title} />
          </div>
        </article>
        <aside className="space-y-8">
          <AdSlot position="side" />
          {side.length > 0 && (
            <div>
              <DHead>Latest in {site.state}</DHead>
              {side.map((a) => (
                <a key={a.slug} href={href(a)} className="block border-b border-white/10 py-2.5">
                  <span className="text-[12px] font-semibold text-[var(--dk-cu)]">{hour(a, tz)}</span>
                  <span className={`${spectral.className} block text-[16px] leading-snug hover:text-[var(--dk-acc)]`}>{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {top.length > 0 && (
            <div className="border border-[var(--dk-acc)]/50 bg-[#0f1c1d] p-5">
              <DHead>Most read</DHead>
              {top.map((a, i) => (
                <a key={a.slug} href={href(a)} className="flex gap-3 border-t border-white/10 py-2.5 first:border-0">
                  <span className={`${spectral.className} w-5 text-[26px] leading-none text-[var(--dk-acc)]`}>{i + 1}</span>
                  <span className="text-[14px] font-semibold leading-snug hover:text-[var(--dk-acc)]">{a.title}</span>
                </a>
              ))}
            </div>
          )}
          {forecast && (
            <div>
              <DHead>{forecast.city}</DHead>
              <div className="flex items-center gap-3"><WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={42} /><span className={`${spectral.className} text-[40px] font-semibold leading-none text-white`}>{forecast.now.temp}°</span><span className="text-[13px] text-white/60">{forecast.now.short}</span></div>
              <div className="mt-3 grid grid-cols-4 text-center">
                {forecast.days.map((x) => <div key={x.name}><p className="text-[12px] font-semibold">{x.name}</p><div className="flex justify-center"><WxIcon short={x.short} isDay size={24} /></div><p className="text-[12px] text-white/60">{x.high}°{x.low != null ? `/${x.low}°` : ""}</p></div>)}
              </div>
            </div>
          )}
          <div className="space-y-4 bg-[#f6efe9] p-4 text-[#2a1d17]" style={light}>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Maricopa", "Pima", "Pinal", "Yavapai", "Coconino", "Yuma"]).filter((c) => counties.includes(c))} />
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </aside>
      </div>

      {row.length > 0 && (
        <section className={`${W} pc-in pc-up mt-14`}>
          <DHead>More from {site.state}</DHead>
          <div className="pc-in pc-stagger grid gap-6 md:grid-cols-3">
            {row.map((a) => (
              <a key={a.slug} href={link(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden bg-[#2a2220]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {a.img && <img src={a.img} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <span className={`${spectral.className} mt-2 block text-[20px] leading-snug group-hover:text-[var(--dk-acc)]`}>{a.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <DkFooter site={site} />
    </div>
  );
}
