import type { SiteConfig } from "@/config/site-config";
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
import { crimson, nunito, coVars, CHead, Label, CoTopBar, CoHeader, CoFooter , ok } from "./shared";

/**
 * Hawaii article page — "coastal" family: a split opening (the photo on one
 * side, section, headline, italic standfirst and byline on a sea tint on the
 * other), then one calm reading column with no sidebar, share at both ends;
 * the latest, most read, forecast and county sit below the story, then a
 * feature row. Structured data stays in the route.
 */
const isStock = (url: string) => /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);

export default function ArticleCoastal({
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
  const when = published ? published.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: tz }) : "";
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
  const W = "mx-auto max-w-[1320px] px-4";
  const link = (a: { category: string; slug: string }) => `/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;

  return (
    <div className={`${nunito.className} ${crimson.variable} min-h-screen overflow-x-hidden bg-white text-[#222]`} style={coVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <ReadingProgress target="#co-story" />
      <CoTopBar site={site} capital={forecast?.now} />
      <CoHeader site={site} MobileMenu={MobileMenu} compact active={categorySlug} />

      {/* split opening: the photo on one side, the headline on a sea tint */}
      <section className={`${W} mt-8`}>
        <div className="grid overflow-hidden rounded-2xl bg-[var(--co-sea)] lg:grid-cols-2">
          {article.featured_image && (
            <div className="pc-clip pc-in relative min-h-[300px] lg:min-h-[520px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.featured_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          )}
          <header className="flex flex-col justify-center p-6 md:p-10">
            <a href={`/${categorySlug}`}><Label>{categoryLabel}</Label></a>
            <h1 className={`${crimson.className} text-[34px] font-semibold leading-[1.08] text-[var(--co-ink)] md:text-[50px]`}><SplitWords text={ok(article.title)} /></h1>
            {article.summary && <p className={`${crimson.className} mt-4 text-[19px] italic leading-relaxed text-[#4a5a66] md:text-[22px]`}>{ok(article.summary)}</p>}
            <p className="mt-5 text-[15px] text-[#4a5a66]">By <b className="text-[var(--co-ink)]">{authorName}</b>{authorTitle ? `, ${authorTitle}` : ""}</p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-[.14em] text-[#7a8a94]">{when} · {minutes} min read</p>
            <div className="mt-5"><ShareBar url={url} title={ok(article.title)} /></div>
          </header>
        </div>
        {article.featured_image && isStock(article.featured_image) && <p className="mt-2 text-[12px] italic text-[#8a99a3]">Illustrative photo from a free stock library; it does not show the people or places in this story.</p>}
      </section>

      <article id="co-story" className="mx-auto mt-10 max-w-[720px] px-4">
        <div className={`${crimson.className} pc-article pc-dropcap`} dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--co-gold)] pt-5">
          <p className={`${crimson.className} text-[18px] italic text-[#555]`}>Share this story</p>
          <ShareBar url={url} title={ok(article.title)} />
        </div>
        <div className="mt-8 bg-[#fbf4ea] p-6 text-center">
          <p className={`${crimson.className} text-[24px] font-semibold italic text-[var(--co-ink)]`}>Know more about this story?</p>
          <p className="mt-1 text-[15px] text-[#555]">Send our newsroom a tip, a correction or a document.</p>
          <a href="/contact" className="mt-3 inline-block border-b-2 border-[var(--co-acc)] pb-0.5 font-semibold text-[var(--co-ink)]">Contact the newsroom ›</a>
        </div>
      </article>

      <AdSlot position="mid" className={`${W} mt-12`} />

      {/* below the story: latest · most read · forecast and county */}
      <section className={`${W} pc-in pc-stagger mt-14 grid gap-10 border-t border-[#e6ddcc] pt-10 lg:grid-cols-3`}>
        {side.length > 0 && (
          <div>
            <CHead>Latest in {site.state}</CHead>
            {side.map((a) => (
              <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#eee] py-2.5">
                <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[#999]">{hour(a, tz)}</span>
                <span className={`${crimson.className} text-[17px] font-semibold leading-snug hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
              </a>
            ))}
          </div>
        )}
        {top.length > 0 && (
          <div className="bg-[#f7f2e8] p-6">
            <CHead>Most read</CHead>
            {top.map((a, i) => (
              <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e6ddcc] py-2.5 last:border-0">
                <span className={`${crimson.className} w-6 text-[28px] font-semibold italic leading-none text-[var(--co-acc)]`}>{i + 1}</span>
                <span className="text-[15.5px] font-semibold leading-snug hover:text-[var(--co-acc)]">{ok(a.title)}</span>
              </a>
            ))}
          </div>
        )}
        <div className="space-y-6">
          {forecast && (
            <div>
              <CHead>{forecast.city} forecast</CHead>
              <div className="flex items-center gap-3"><WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={44} /><span className={`${crimson.className} text-[44px] font-semibold leading-none`}>{forecast.now.temp}°</span><span className="text-[14px] text-[#666]">{forecast.now.short}</span></div>
              <div className="mt-3 grid grid-cols-4 text-center">
                {forecast.days.map((d) => (
                  <div key={d.name}><p className="text-[13px] font-semibold">{d.name}</p><div className="flex justify-center"><WxIcon short={d.short} isDay size={26} /></div><p className="text-[12px] text-[#666]">{d.high}°{d.low != null ? `/${d.low}°` : ""}</p></div>
                ))}
              </div>
            </div>
          )}
          <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Honolulu", "Hawaii", "Maui", "Kauai"]).filter((c) => counties.includes(c))} />
          <AlertsBox name={site.name} state={site.state} />
        </div>
      </section>

      {row.length > 0 && (
        <section className={`${W} pc-in pc-up mt-14`}>
          <CHead>More from {site.state}</CHead>
          <div className="pc-in pc-stagger grid gap-8 md:grid-cols-3">
            {row.map((a) => (
              <a key={a.slug} href={link(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden bg-[#eee]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {a.img && <img src={a.img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <span className={`${crimson.className} mt-3 block text-[22px] font-semibold leading-snug group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                {a.summary && <span className="mt-1 block line-clamp-2 text-[15px] text-[#666]">{ok(a.summary)}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <CoFooter site={site} />
    </div>
  );
}
