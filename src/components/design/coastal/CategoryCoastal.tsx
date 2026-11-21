import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago, srcSetOf } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { crimson, nunito, coVars, CHead, Label, CoTopBar, CoHeader, CoFooter , ok } from "./shared";

/**
 * Hawaii section page — "coastal" family: a quiet centred title in
 * italic serif with a one-line description, the top story as a cover (photo
 * left, headline right), an editorial grid, a Hawai‘i sub-section
 * (the Capitol for politics, tourism and housing for business...), the county
 * finder, headlines and pagination. Real stories only.
 */
const ABOUT: Record<string, string> = {
  politics: "The State Capitol, the governor, the counties and the races shaping Hawai‘i.",
  business: "Tourism, agriculture, the military economy, housing and the companies of the islands.",
  sports: "The Rainbow Warriors and Rainbow Wahine, surfing, paddling and high school sports across the islands.",
  opinion: "Columns and editorials on the questions facing Hawai‘i.",
  life: "Food, culture, the ocean, the land and everyday island life.",
  "local-news": "News from O‘ahu, Maui, the Big Island, Kaua‘i and every island community.",
};
const SUB: Record<string, [string, RegExp]> = {
  politics: ["At the Capitol", /(legislat|senat|house|capitol|governor|green|lawmaker|bill)/i],
  business: ["Tourism & housing", /(tourism|tourist|visitor|hotel|airline|housing|rent|vacation rental)/i],
  sports: ["Surf & ocean sports", /(surf|surfing|pipeline|paddl|canoe|swim|ocean)/i],
  life: ["Ocean & land", /(beach|reef|ocean|whale|turtle|trail|hike|park|volcano)/i],
  "local-news": ["Public safety", /(police|arrest|court|crash|fire|shooting)/i],
};

export default function CategoryCoastal({
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
  const used = new Set<string>();
  const take = (list: HomeArticle[], n: number) => {
    const out: HomeArticle[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      // the same story is sometimes filed twice under two addresses
      const t = a ? a.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : "";
      if (a && !used.has(a.slug) && !used.has(t)) {
        used.add(a.slug);
        used.add(t);
        out.push(a);
      }
    }
    return out;
  };
  const [lead] = take(stories, 1);
  const grid = take(stories, 6);
  const sub = SUB[slug];
  const subList = sub ? take(stories.concat(latestState).filter((a) => sub[1].test(a.title)), 3) : [];
  const rest = take(stories, 12);
  const stateLatest = take(latestState, 8);
  const W = "mx-auto max-w-[1320px] px-4";
  const Img = ({ a, sizes = "(max-width: 640px) 92vw, 420px" }: { a: HomeArticle; sizes?: string }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} srcSet={srcSetOf(a.img)} sizes={sizes} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
    ) : (
      <div className="h-full w-full bg-gradient-to-br from-[var(--co-ink)] to-[var(--co-acc)]" />
    );

  return (
    <div className={`${nunito.className} ${crimson.variable} min-h-screen overflow-x-hidden bg-white text-[#222]`} style={coVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <CoTopBar site={site} capital={capital} />
      <CoHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      <section className="mx-auto max-w-[860px] px-4 py-10 text-center md:py-14">
        <p className="text-[13px] uppercase tracking-[.2em] text-[#999]"><a href="/" className="hover:text-[var(--co-acc)]">Home</a> · Section</p>
        <h1 className={`${crimson.className} mt-2 text-[56px] font-semibold italic leading-none text-[var(--co-ink)] md:text-[84px]`}><SplitWords text={label} /></h1>
        <p className={`${crimson.className} mt-4 text-[19px] text-[#555]`}>{ABOUT[slug] || `The latest ${label.toLowerCase()} from across Hawai‘i.`}</p>
        <span className="mx-auto mt-6 block h-px w-24 bg-[var(--co-gold)]" />
      </section>

      <main className={W}>
        {lead && (
          <a href={href(lead)} className="group grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <span className="pc-clip pc-in pc-zoom block aspect-[3/2] overflow-hidden"><Img a={lead} sizes="100vw" /></span>
            <span>
              <Label>Top story</Label>
              <span className={`${crimson.className} block text-[34px] font-semibold leading-[1.08] group-hover:text-[var(--co-acc)] md:text-[46px]`}>{ok(lead.title)}</span>
              {lead.summary && <span className="mt-4 block text-[17px] leading-relaxed text-[#555]">{ok(lead.summary)}</span>}
              <span className="mt-3 block text-[14px] text-[#888]">{lead.author ? `By ${lead.author} · ` : ""}{ago(lead)}</span>
            </span>
          </a>
        )}

        <AdSlot position="top" className="mt-10" />

        {grid.length > 0 && (
          <section className="pc-in pc-stagger mt-14 grid gap-x-8 gap-y-10 border-t border-[#e6ddcc] pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <a key={a.slug} href={href(a)} className="pc-card group block">
                <span className="pc-zoom block aspect-[3/2] overflow-hidden"><Img a={a} /></span>
                <span className={`${crimson.className} mt-3 block text-[22px] font-semibold leading-snug group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                {a.summary && <span className="mt-1 block line-clamp-2 text-[15px] text-[#666]">{ok(a.summary)}</span>}
                <span className="mt-1 block text-[12px] text-[#999]">{ago(a)}</span>
              </a>
            ))}
          </section>
        )}

        <section className="pc-in pc-up mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {subList.length > 0 ? (
            <div className="bg-[#f7f2e8] p-6">
              <CHead>{sub![0]}</CHead>
              <div className="grid gap-6 sm:grid-cols-3">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group block">
                    <span className="pc-zoom block aspect-[4/3] overflow-hidden"><Img a={a} /></span>
                    <span className={`${crimson.className} mt-2 block text-[18px] font-semibold leading-snug group-hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6">
            <div>
              <CHead>Your county</CHead>
              <CountySearch state={site.state} counties={counties} popular={["Honolulu", "Hawaii", "Maui", "Kauai"].filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-14 grid gap-12 lg:grid-cols-2">
            {rest.length > 0 && (
              <div>
                <CHead>{label} headlines</CHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#eee] py-3">
                    <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[#999]">{hour(a, tz)}</span>
                    <span className={`${crimson.className} text-[17px] font-semibold leading-snug hover:text-[var(--co-acc)]`}>{ok(a.title)}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div>
                <CHead>Latest in {site.state}</CHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#eee] py-3">
                    <span className="w-16 shrink-0 pt-0.5 text-[13px] text-[var(--co-acc)]">{hour(a, tz)}</span>
                    <span className="text-[15.5px] font-semibold leading-snug hover:text-[var(--co-acc)]">{ok(a.title)}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className={`${crimson.className} mt-12 flex flex-wrap items-center justify-center gap-3 text-[18px]`} aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="px-2 italic hover:text-[var(--co-acc)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-10 w-10 items-center justify-center rounded-full ${n === page ? "bg-[var(--co-ink)] text-white" : "hover:bg-[#f3ede1]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="px-2 italic hover:text-[var(--co-acc)]">Next ›</a>}
          </nav>
        )}
      </main>

      <CoFooter site={site} />
    </div>
  );
}
