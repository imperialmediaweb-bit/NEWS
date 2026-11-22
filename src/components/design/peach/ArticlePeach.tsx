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
import { popularOf } from "@/config/state-data";
import AlertsBox from "../live/AlertsBox";
import CountySearch from "../live/CountySearch";
import PeachFx, { SplitWords } from "./PeachFx";
import { display, body, peachVars, PHead, Ico, PeachTopBar, PeachHeader, PeachFooter } from "./shared";

/**
 * Georgia article page — "peach" family. A magazine opening, unlike the
 * Texas page: the lead photo runs the full width with the headline, standfirst
 * and byline set on it, then the story in a reading column with the share
 * rail, drop cap and progress bar, a sidebar with the latest from the state,
 * most read, the capital's forecast, county search and alerts, and a bento of
 * more stories. Structured data, AMP and canonical stay in the route.
 */

const isStock = (url: string) => /pexels\.com|unsplash\.com|pixabay\.com/i.test(url);
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

export default function ArticlePeach({
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
    ? `${published.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: tz })} · ${published.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" })}`
    : "";
  const raw = article.content.includes("<p") ? article.content : article.content.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${p.trim()}</p>`).join("\n");
  const norm = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/gi, " ").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
  // A story that opens with its own headline repeats the h1; drop the repeat.
  const html = raw.replace(/^\s*<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i, (m, inner) => (norm(inner) === norm(article.title) ? "" : m));
  const words = article.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
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
  const sideLatest = pick(latest, 5);
  const top = pick(mostRead, 5);
  const upNext = pick(latest, 1)[0];
  const more = pick<LiveRelated>(related.concat(latest.map((a) => ({ img: a.img, title: a.title, summary: a.summary, category: a.category, date: a.date, slug: a.slug }))), 5);
  const headlines = pick(latest, 8);
  const img = article.featured_image;
  const W = "mx-auto max-w-[1360px] px-4";

  return (
    <div className={`${body.className} ${display.variable} min-h-screen overflow-x-hidden bg-[var(--pc-paper)] text-[#2b1d17]`} style={peachVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <ReadingProgress target="#pc-story" />
      <PeachTopBar site={site} capital={forecast?.now} />
      <PeachHeader site={site} MobileMenu={MobileMenu} compact active={categorySlug} />

      {/* magazine opening: the photo full width, the headline on it */}
      <section className={`relative overflow-hidden bg-[var(--pc-ink)] text-white ${img ? "pc-parallax min-h-[560px] md:min-h-[680px]" : ""}`}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,12,8,.25),rgba(30,12,8,.35)_35%,rgba(30,12,8,.92)_80%),linear-gradient(90deg,rgba(30,12,8,.6),transparent_70%)]" />
        <div className={`${W} relative flex min-h-[inherit] flex-col justify-end pb-10 pt-24 md:pb-14`}>
          <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-white/75">
            <a href="/" className="hover:text-white">Home</a> <span className="mx-1">›</span> <a href={`/${categorySlug}`} className="hover:text-white">{categoryLabel}</a>
          </nav>
          <a href={`/${categorySlug}`} className="w-fit rounded-sm bg-[var(--pc-acc)] px-2.5 py-1 text-[12px] font-bold uppercase tracking-[.08em]">{categoryLabel}</a>
          <h1 className={`${display.className} mt-4 max-w-[980px] text-[34px] font-extrabold leading-[1.06] md:text-[60px]`}><SplitWords text={article.title} /></h1>
          {article.summary && <p className={`${display.className} mt-4 max-w-[760px] text-[18px] font-semibold italic leading-relaxed text-white/88 md:text-[22px]`}>{article.summary}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/20 pt-5">
            <span className={`${display.className} flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pc-acc)] text-[18px] font-extrabold`}>{initials(authorName)}</span>
            <span>
              <span className="block text-[15px] font-bold">By {authorName}</span>
              <span className="block text-[13px] text-white/70">{authorTitle ? `${authorTitle} · ` : ""}{when}{when ? " · " : ""}{minutes} min read</span>
            </span>
          </div>
        </div>
      </section>
      {img && (
        <p className={`${W} pt-2 text-[12px] text-[#8a7a72]`}>
          {isStock(img) ? "Illustrative photo from a free stock library; it does not show the people or places in this story." : "Photo"}
        </p>
      )}

      <div className={`${W} mt-8 grid gap-10 lg:grid-cols-[64px_minmax(0,1fr)_340px]`}>
        {/* share rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-6"><ShareBar url={url} title={article.title} vertical /></div>
        </aside>

        {/* the story */}
        <article id="pc-story" className="min-w-0">
          <div className={`${display.className} pc-article pc-dropcap mx-auto max-w-[720px]`} dangerouslySetInnerHTML={{ __html: html }} />
          <div className="mx-auto mt-8 max-w-[720px] border-t border-[var(--pc-cu)]/30 pt-5"><ShareBar url={url} title={article.title} /></div>
          {upNext && (
            <a href={href(upNext)} className="pc-card pc-spot group mx-auto mt-8 flex max-w-[720px] items-center gap-5 overflow-hidden rounded-md bg-[linear-gradient(135deg,#f7dccf,#fbeee6)] p-4">
              <span className="pc-zoom h-24 w-32 shrink-0 overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {upNext.img && <img src={upNext.img} alt={upNext.title} className="h-full w-full object-cover" loading="lazy" />}
              </span>
              <span>
                <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[var(--pc-acc)]">Up next</span>
                <span className={`${display.className} block text-[21px] font-bold leading-snug text-[var(--pc-ink)] group-hover:text-[var(--pc-acc)]`}>{upNext.title}</span>
              </span>
            </a>
          )}
          <div className="mx-auto mt-8 max-w-[720px] rounded-md bg-[var(--pc-ink)] p-6 text-white">
            <p className={`${display.className} text-[22px] font-bold`}>Know more about this story?</p>
            <p className="mt-1 text-[15px] text-white/80">Send our newsroom a tip, a correction or a document.</p>
            <a href="/contact" className="mt-3 inline-block rounded-sm bg-[var(--pc-acc)] px-5 py-2 text-[14px] font-bold">Contact the newsroom →</a>
          </div>
        </article>

        {/* sidebar */}
        <aside className="space-y-6">
          {sideLatest.length > 0 && (
            <div className="pc-spot rounded-md border border-[var(--pc-cu)]/30 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-[14px] font-extrabold uppercase tracking-[.06em] text-[var(--pc-acc)]"><span className="pc-dot" aria-hidden /> Latest in {site.state}</p>
              <ol className="border-l-2 border-[var(--pc-acc)]/35 pl-4">
                {sideLatest.map((a) => (
                  <li key={a.slug} className="relative pb-3 last:pb-0">
                    <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--pc-acc)]" aria-hidden />
                    <span className="text-[12px] font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                    <a href={href(a)} className="block text-[14.5px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title}</a>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {top.length > 0 && (
            <div className="rounded-md bg-[var(--pc-ink)] p-5 text-white">
              <PHead icon={Ico.flame} light>Most read</PHead>
              <ol>
                {top.map((a, i) => (
                  <li key={a.slug} className="flex gap-3 border-t border-white/15 py-2.5 first:border-0">
                    <span className={`${display.className} w-7 shrink-0 text-[28px] font-black leading-none text-[var(--pc-acc)]`}>{i + 1}</span>
                    <a href={href(a)} className="text-[14.5px] font-semibold leading-snug hover:text-[#ffc4ad]">{a.title}</a>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {forecast && (
            <div className="rounded-md border border-[var(--pc-cu)]/30 bg-white p-5">
              <PHead icon={Ico.sun}>{forecast.city} forecast</PHead>
              <div className="flex items-center gap-3">
                <WxIcon short={forecast.now.short} isDay={forecast.now.isDay} size={48} />
                <span className={`${display.className} text-[40px] font-extrabold text-[var(--pc-ink)]`}>{forecast.now.temp}°</span>
                <span className="text-[13px] text-[#6d5d55]">{forecast.now.short}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {forecast.days.map((d) => (
                  <div key={d.name} className="rounded-sm bg-[var(--pc-paper)] py-2">
                    <p className="text-[12px] font-bold text-[var(--pc-ink)]">{d.name}</p>
                    <div className="flex justify-center"><WxIcon short={d.short} isDay size={26} /></div>
                    <p className="text-[12px] text-[#5a4a42]">{d.high}°{d.low != null ? ` / ${d.low}°` : ""}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#8a7a72]">National Weather Service</p>
            </div>
          )}
          <div className="rounded-md border border-[var(--pc-cu)]/30 bg-white p-5">
            <PHead icon={Ico.pin}>Your county</PHead>
            <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Fulton", "Gwinnett", "Cobb", "DeKalb", "Chatham", "Richmond"]).filter((c) => counties.includes(c))} />
          </div>
          <AlertsBox name={site.name} state={site.state} />
        </aside>
      </div>

      {/* more stories: bento */}
      {more.length >= 3 && (
        <section className="pc-in pc-up mt-14 bg-[linear-gradient(135deg,#f7dccf,#fbeee6_55%,#f3e2d3)] py-10">
          <div className={W}>
            <PHead icon={Ico.leaf}>More from {site.state}</PHead>
            <div className="pc-stagger pc-in grid gap-4 md:grid-cols-4">
              {more.map((a, i) => (
                <a key={a.slug} href={`/${(a.category || "news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`} className={`pc-card group relative block min-h-[230px] overflow-hidden rounded-md bg-[var(--pc-ink)] ${i === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[470px]" : ""}`}>
                  {a.img && (
                    <span className="pc-zoom absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.img} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  )}
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(30,12,8,.92))]" />
                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="text-[11.5px] font-bold uppercase tracking-[.08em] text-[#ffc4ad]">{a.category.replace(/-/g, " ")}</span>
                    <span className={`${display.className} mt-1 block font-extrabold leading-tight text-white ${i === 0 ? "text-[30px]" : "text-[18px]"}`}>{a.title}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      {headlines.length > 0 && (
        <section className={`${W} pc-in pc-up mt-10`}>
          <PHead icon={Ico.brief} link="/local-news">The latest</PHead>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {headlines.map((a) => (
              <li key={a.slug} className="flex gap-4 border-b border-[var(--pc-cu)]/20 py-3">
                <span className="w-16 shrink-0 pt-0.5 text-[12px] font-bold text-[var(--pc-cu)]">{hour(a, tz)}</span>
                <a href={href(a)} className="text-[15.5px] font-semibold leading-snug text-[var(--pc-ink)] hover:text-[var(--pc-acc)]">{a.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PeachFooter site={site} />
    </div>
  );
}
