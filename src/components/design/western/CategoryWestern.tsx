import type { SiteConfig } from "@/config/site-config";
import PremiumFx from "../extras/PremiumFx";
import { NAV as PNAV_ALL } from "../live/shared";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { popularOf, genericAbout, genericSub } from "@/config/state-data";
import { zilla, lora, wsVars, WHead, WKick, WRule, WsTopBar, WsHeader, WsFooter } from "./shared";

/**
 * Montana section front — "western heritage" family (from the broadsheet layout, in Montana type and colour): the section name large in
 * Caslon over a gold double rule, a front-page arrangement (lead with deck,
 * two columns of stories beside it), a Montana sub-section (Helena for
 * politics, Wall Street for business...), the county finder, headlines and
 * pagination. Real stories only.
 */
const ABOUT_ORIG: Record<string, string> = {
  politics: "The Capitol in Helena, the governor, Congress and the races shaping Montana.",
  business: "Ranching, energy, tourism, tech in Bozeman and the companies of Big Sky country.",
  sports: "The Griz, the Bobcats, Carroll, rodeo, skiing and Friday nights across Montana.",
  opinion: "Columns and editorials on the questions facing Montana.",
  life: "The outdoors, food, culture and life in Big Sky country.",
  "local-news": "News from Billings to Kalispell and all 56 counties.",
};
const SUB_ORIG: Record<string, [string, RegExp]> = {
  politics: ["Helena", /(helena|legislat|senat|house|capitol|governor|gianforte|lawmaker|bill)/i],
  business: ["Land & energy", /(ranch|cattle|land|energy|oil|coal|mine|timber|tourism)/i],
  sports: ["Griz & Cats", /(griz|grizzlies|bobcats|cats|montana state|um )/i],
  life: ["Outdoors", /(park|glacier|yellowstone|hunt|fish|ski|trail|river)/i],
  "local-news": ["Public safety", /(police|sheriff|arrest|court|crash|fire|shooting)/i],
};

export default function CategoryWestern({
  site,
  slug,
  label,
  stories,
  latestState,
  capital,
  counties,
  page,
  totalPages,
}: {
  site: SiteConfig;
  slug: string;
  label: string;
  stories: HomeArticle[];
  latestState: HomeArticle[];
  capital?: CityWeather;
  counties: string[];
  page: number;
  totalPages: number;
}) {
  const tz = TZ[site.state] || "America/New_York";
  // the descriptions and sub-sections written for Montana; any other state gets general ones
  const ABOUT = site.state === "Montana" ? ABOUT_ORIG : genericAbout(site.state);
  const SUB = site.state === "Montana" ? SUB_ORIG : genericSub(site.state);
  const used = new Set<string>();
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
  const [lead, ...cols] = take(stories, 7);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 4) : [];
  const rest = take(stories, 12);
  const stateLatest = take(latestState, 8);
  const W = "mx-auto max-w-[1340px] px-4";
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt={a.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-[#e9e4d8]" />
    );

  return (
    <div className={`${lora.className} ${zilla.variable} min-h-screen overflow-x-hidden ws-paper text-[#1a1a1a]`} style={wsVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <PremiumFx logo={`/logos/${site.slug}.svg`} name={site.name} nav={PNAV_ALL.map(([l, h]) => [l, h === "#weather" ? "/#weather" : h] as [string, string])} />
      <WsTopBar site={site} capital={capital} />
      <WsHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      <main className={W}>
        <section className="pt-8">
          <p className="text-[12px] uppercase tracking-[.14em] text-[#777]"><a href="/" className="hover:text-[var(--ws-acc)]">Home</a> › Section</p>
          <h1 className={`${zilla.className} text-[54px] font-bold leading-none md:text-[80px]`}><SplitWords text={label} /></h1>
          <p className={`${zilla.className} mt-2 text-[18px] italic text-[#444]`}>{ABOUT[slug] || `The latest ${label.toLowerCase()} from across ${site.state}.`}</p>
          <WRule className="mt-5" />
        </section>

        {lead && (
          <section className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr] lg:divide-x lg:divide-[var(--ws-gold)]">
            <a href={href(lead)} className="group block">
              <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden"><Img a={lead} sizes="100vw" /></span>
              <span className={`${zilla.className} mt-3 block text-[32px] font-bold leading-[1.08] group-hover:text-[var(--ws-acc)]`}>{lead.title}</span>
              {lead.summary && <span className={`${zilla.className} mt-2 block text-[17px] italic text-[#333]`}>{lead.summary}</span>}
              <span className="mt-2 block text-[13px]"><b>{lead.author ? `By ${lead.author}` : site.name}</b> · {ago(lead)}</span>
            </a>
            {[cols.slice(0, 3), cols.slice(3, 6)].map((col, i) => (
              <div key={i} className="pc-in pc-stagger lg:pl-8">
                {col.map((a, j) => (
                  <a key={a.slug} href={href(a)} className="group block border-b border-[#e3dccb] py-3 first:pt-0">
                    {j === 0 && a.img && <span className="pc-zoom mb-2 block aspect-[16/10] overflow-hidden"><Img a={a} /></span>}
                    <span className={`${zilla.className} block text-[19px] font-bold leading-snug group-hover:text-[var(--ws-acc)]`}>{a.title}</span>
                    <span className="text-[12px] text-[#777]">{ago(a)}</span>
                  </a>
                ))}
              </div>
            ))}
          </section>
        )}

        <AdSlot position="top" className="mt-8" />

        <section className="pc-in pc-up mt-10 grid gap-8 border-t-[3px] border-[#0a0a0a] pt-5 lg:grid-cols-[1.5fr_1fr]">
          {subList.length > 0 ? (
            <div>
              <WKick>{sub![0]}</WKick>
              <div className="grid gap-5 sm:grid-cols-2">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group flex gap-3">
                    <span className="pc-zoom h-[80px] w-[110px] shrink-0 overflow-hidden"><Img a={a} /></span>
                    <span className={`${zilla.className} text-[16px] font-bold leading-snug group-hover:text-[var(--ws-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6 lg:border-l lg:border-[var(--ws-gold)] lg:pl-8">
            <div>
              <WHead>Your county</WHead>
              <CountySearch state={site.state} counties={counties} popular={popularOf(site.state, ["Yellowstone", "Gallatin", "Missoula", "Flathead", "Cascade", "Lewis and Clark"]).filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[var(--ws-gold)]">
            {rest.length > 0 && (
              <div>
                <WHead>{label} headlines</WHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e3dccb] py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--ws-acc)]">{hour(a, tz)}</span>
                    <span className={`${zilla.className} text-[16px] leading-snug hover:text-[var(--ws-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div className="lg:pl-10">
                <WHead>Latest in {site.state}</WHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e3dccb] py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[#777]">{hour(a, tz)}</span>
                    <span className="text-[15px] font-semibold leading-snug hover:text-[var(--ws-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className={`${zilla.className} mt-10 flex flex-wrap items-center justify-center gap-2 text-[17px]`} aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="px-2 italic hover:text-[var(--ws-acc)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-9 w-9 items-center justify-center border ${n === page ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[var(--ws-gold)] hover:border-[#0a0a0a]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="px-2 italic hover:text-[var(--ws-acc)]">Next ›</a>}
          </nav>
        )}
      </main>

      <WsFooter site={site} />
    </div>
  );
}
