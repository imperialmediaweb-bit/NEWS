import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import { TZ, href, hour, ago } from "../live/shared";
import MobileMenu from "../live/MobileMenu";
import CountySearch from "../live/CountySearch";
import AlertsBox from "../live/AlertsBox";
import PeachFx, { SplitWords } from "../peach/PeachFx";
import AdSlot from "../AdSlot";
import { caslon, pub, bsVars, BHead, Kick, Double, BsTopBar, BsHeader, BsFooter } from "./shared";

/**
 * New York section front — "broadsheet" family: the section name large in
 * Caslon over a gold double rule, a front-page arrangement (lead with deck,
 * two columns of stories beside it), a New York sub-section (Albany for
 * politics, Wall Street for business...), the county finder, headlines and
 * pagination. Real stories only.
 */
const ABOUT: Record<string, string> = {
  politics: "Albany, City Hall, Congress and the races shaping New York.",
  business: "Wall Street, real estate, tech, upstate industry and the New York economy.",
  sports: "Yankees, Mets, Knicks, Nets, Rangers, Islanders, Giants, Jets, Bills, Sabres and the high school and college teams statewide.",
  opinion: "Columns and editorials on the questions facing New York.",
  life: "Food, the arts, the outdoors and everyday life from the city to upstate.",
  "local-news": "News from the five boroughs, Long Island, the Hudson Valley and all 62 counties.",
};
const SUB: Record<string, [string, RegExp]> = {
  politics: ["Albany", /\b(albany|legislat|senat|assembly|capitol|governor|hochul|lawmaker|bill)\b/i],
  business: ["Wall Street & real estate", /\b(wall street|stock|bank|real estate|rent|housing|developer|office)\b/i],
  sports: ["New York teams", /\b(yankees|mets|knicks|nets|rangers|islanders|sabres|giants|jets|bills|liberty)\b/i],
  life: ["Arts & culture", /\b(museum|broadway|theater|theatre|art|music|concert|festival|restaurant)\b/i],
  "local-news": ["Crime & justice", /\b(police|nypd|arrest|court|crash|fire|shooting|judge)\b/i],
};

export default function CategoryBroadsheet({
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
  const Img = ({ a }: { a: HomeArticle }) =>
    a.img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={a.img} alt="" className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <div className="h-full w-full bg-[#e9e4d8]" />
    );

  return (
    <div className={`${pub.className} ${caslon.variable} min-h-screen overflow-x-hidden bg-[#fdfcf9] text-[#1a1a1a]`} style={bsVars(site)}>
      <noscript><style>{`.pc-in{opacity:1!important;translate:none!important}.pc-in *{opacity:1!important;transform:none!important;clip-path:none!important}`}</style></noscript>
      <PeachFx />
      <BsTopBar site={site} capital={capital} />
      <BsHeader site={site} MobileMenu={MobileMenu} compact active={slug} />

      <main className={W}>
        <section className="pt-8">
          <p className="text-[12px] uppercase tracking-[.14em] text-[#777]"><a href="/" className="hover:text-[var(--bs-acc)]">Home</a> › Section</p>
          <h1 className={`${caslon.className} text-[54px] font-bold leading-none md:text-[80px]`}><SplitWords text={label} /></h1>
          <p className={`${caslon.className} mt-2 text-[18px] italic text-[#444]`}>{ABOUT[slug] || `The latest ${label.toLowerCase()} from across New York.`}</p>
          <Double className="mt-5" />
        </section>

        {lead && (
          <section className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr] lg:divide-x lg:divide-[var(--bs-gold)]">
            <a href={href(lead)} className="group block">
              <span className="pc-clip pc-in pc-zoom block aspect-[16/10] overflow-hidden"><Img a={lead} /></span>
              <span className={`${caslon.className} mt-3 block text-[32px] font-bold leading-[1.08] group-hover:text-[var(--bs-acc)]`}>{lead.title}</span>
              {lead.summary && <span className={`${caslon.className} mt-2 block text-[17px] italic text-[#333]`}>{lead.summary}</span>}
              <span className="mt-2 block text-[13px]"><b>{lead.author ? `By ${lead.author}` : site.name}</b> · {ago(lead)}</span>
            </a>
            {[cols.slice(0, 3), cols.slice(3, 6)].map((col, i) => (
              <div key={i} className="pc-in pc-stagger lg:pl-8">
                {col.map((a, j) => (
                  <a key={a.slug} href={href(a)} className="group block border-b border-[#e3dccb] py-3 first:pt-0">
                    {j === 0 && a.img && <span className="pc-zoom mb-2 block aspect-[16/10] overflow-hidden"><Img a={a} /></span>}
                    <span className={`${caslon.className} block text-[19px] font-bold leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
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
              <Kick>{sub![0]}</Kick>
              <div className="grid gap-5 sm:grid-cols-2">
                {subList.map((a) => (
                  <a key={a.slug} href={href(a)} className="group flex gap-3">
                    <span className="pc-zoom h-[80px] w-[110px] shrink-0 overflow-hidden"><Img a={a} /></span>
                    <span className={`${caslon.className} text-[16px] font-bold leading-snug group-hover:text-[var(--bs-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-6 lg:border-l lg:border-[var(--bs-gold)] lg:pl-8">
            <div>
              <BHead>Your county</BHead>
              <CountySearch state={site.state} counties={counties} popular={["New York", "Kings", "Queens", "Bronx", "Nassau", "Suffolk"].filter((c) => counties.includes(c))} />
            </div>
            <AlertsBox name={site.name} state={site.state} />
          </div>
        </section>

        {(rest.length > 0 || stateLatest.length > 0) && (
          <section className="pc-in pc-up mt-12 grid gap-10 lg:grid-cols-2 lg:divide-x lg:divide-[var(--bs-gold)]">
            {rest.length > 0 && (
              <div>
                <BHead>{label} headlines</BHead>
                {rest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e3dccb] py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[var(--bs-acc)]">{hour(a, tz)}</span>
                    <span className={`${caslon.className} text-[16px] leading-snug hover:text-[var(--bs-acc)]`}>{a.title}</span>
                  </a>
                ))}
              </div>
            )}
            {stateLatest.length > 0 && (
              <div className="lg:pl-10">
                <BHead>Latest in New York</BHead>
                {stateLatest.map((a) => (
                  <a key={a.slug} href={href(a)} className="flex gap-4 border-b border-[#e3dccb] py-2.5">
                    <span className="w-16 shrink-0 pt-0.5 text-[12px] font-semibold text-[#777]">{hour(a, tz)}</span>
                    <span className="text-[15px] font-semibold leading-snug hover:text-[var(--bs-acc)]">{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {totalPages > 1 && (
          <nav className={`${caslon.className} mt-10 flex flex-wrap items-center justify-center gap-2 text-[17px]`} aria-label="Pages">
            {page > 1 && <a href={`/${slug}?page=${page - 1}`} className="px-2 italic hover:text-[var(--bs-acc)]">‹ Previous</a>}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, totalPages - 4))).map((n) => (
              <a key={n} href={`/${slug}?page=${n}`} className={`flex h-9 w-9 items-center justify-center border ${n === page ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[var(--bs-gold)] hover:border-[#0a0a0a]"}`}>{n}</a>
            ))}
            {page < totalPages && <a href={`/${slug}?page=${page + 1}`} className="px-2 italic hover:text-[var(--bs-acc)]">Next ›</a>}
          </nav>
        )}
      </main>

      <BsFooter site={site} />
    </div>
  );
}
