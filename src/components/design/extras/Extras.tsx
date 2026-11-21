import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather, GasPrices } from "@/lib/local-data";
import { TZ, href, ago } from "../live/shared";
import { CountUp, CityTabs, DragScroll, TiltFx } from "./ExtrasFx";

/**
 * Premium sections shared by every family (user, 21.11.2026: "mai lungi,
 * mai cu efecte, mai premium", "toate zonele umplute, nu goale"): a numbers
 * band that counts up, stories by city in tabs, a draggable picture gallery,
 * the week as a timeline and a tilting section mosaic. Everything comes from
 * the real stories and data; a block with too little to show is left out,
 * never padded. Colours and fonts come from the family through CSS variables
 * (--x-ink, --x-acc, --x-bg, --x-line) and the `head` font class.
 */
export interface ExtrasTheme { ink: string; acc: string; bg: string; line: string; text: string; head: string; dark?: boolean }

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function Extras({ site, pool, used, weather, gas, counties, theme }: {
  site: SiteConfig;
  pool: HomeArticle[];
  used: Set<string>;
  weather: CityWeather[];
  gas?: GasPrices | null;
  counties: string[];
  theme: ExtrasTheme;
}) {
  const tz = TZ[site.state] || "America/New_York";
  // These sections are views of the whole week (pictures, days, cities), so
  // they may show a story that also appears higher up; within each section a
  // story appears once. `used` only keeps the lead out of the gallery.
  const seen = new Set<string>();
  void used;
  const take = (list: HomeArticle[], n: number, needImg = false) => {
    const out: HomeArticle[] = [];
    for (const a of list) {
      if (out.length >= n) break;
      if (!a || (needImg && !a.img)) continue;
      const t = norm(a.title);
      if (seen.has(a.slug) || seen.has(t)) continue;
      seen.add(a.slug);
      seen.add(t);
      out.push(a);
    }
    return out;
  };
  const day = 86400000;
  const today = pool.filter((a) => a.iso && Date.now() - new Date(a.iso).getTime() < day).length;
  const week = pool.filter((a) => a.iso && Date.now() - new Date(a.iso).getTime() < 7 * day).length;
  const hot = weather.length ? weather.reduce((m, w) => (w.temp > m.temp ? w : m), weather[0]) : null;
  const cool = weather.length ? weather.reduce((m, w) => (w.temp < m.temp ? w : m), weather[0]) : null;

  // stories by city: the state's weather cities that have at least three stories
  const tabs: Array<{ city: string; items: Array<{ href: string; title: string; img: string; when: string }> }> = [];
  for (const w of weather) {
    const name = w.city.replace(/ City$/, "");
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const list = pool.filter((a) => re.test(a.title) || re.test(a.summary || "")).slice(0, 4);
    if (list.length >= 3) tabs.push({ city: w.city, items: list.map((a) => ({ href: href(a), title: a.title, img: a.img, when: ago(a) })) });
    if (tabs.length >= 6) break;
  }
  const gallery = take(pool, 10, true);
  seen.clear();
  // the week, day by day
  const days: Array<[string, HomeArticle[]]> = [];
  for (let k = 0; k < 5; k++) {
    const label = new Date(Date.now() - k * day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: tz });
    const list = take(pool.filter((a) => a.iso && new Date(a.iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: tz }) === label), 3);
    if (list.length) days.push([k === 0 ? "Today" : k === 1 ? "Yesterday" : label, list]);
  }
  const SECTIONS: Array<[string, string]> = [["Local", "local-news"], ["Politics", "politics"], ["Business", "business"], ["Sports", "sports"], ["Life", "life"], ["Opinion", "opinion"]];
  const tiles = SECTIONS.map(([label, slug]) => {
    const a = pool.find((x) => x.img && (x.category || "").toLowerCase().replace(/\s+/g, "-") === slug) || null;
    return { label, slug, a };
  }).filter((t) => t.a);

  // every row of the mosaic is full: 6 → 3+3, 5 → 2+3, 4 → 2+2, 3 → 3
  const n = tiles.length;
  const spans = tiles.map((_, i) => {
    const wide = n === 4 || (n === 5 && i < 2);
    return `${wide ? "lg:col-span-3 aspect-[16/8]" : "lg:col-span-2 aspect-[16/10]"} ${n % 2 && i === n - 1 ? "col-span-2 lg:col-span-2" : ""}`;
  });
  const vars = { ["--x-ink" as string]: theme.ink, ["--x-acc" as string]: theme.acc, ["--x-bg" as string]: theme.bg, ["--x-line" as string]: theme.line, color: theme.text } as React.CSSProperties;
  const H = `${theme.head} text-[30px] md:text-[40px] font-bold leading-tight`;
  const W = "mx-auto max-w-[1340px] px-4";
  const stats: Array<[number, string, string, string?]> = [];
  if (today) stats.push([today, "stories in the last 24 hours", ""]);
  if (week) stats.push([week, "stories this week", ""]);
  if (counties.length) stats.push([counties.length, `counties we cover`, ""]);
  if (hot) stats.push([hot.temp, `°F in ${hot.city}, the warmest now`, ""]);
  if (cool && hot && cool.city !== hot.city) stats.push([cool.temp, `°F in ${cool.city}, the coolest`, ""]);
  if (gas?.grades[0]) stats.push([gas.grades[0].price, `a gallon of regular${gas.isRegion ? `, ${gas.area}` : ""}`, "$"]);

  return (
    <div className={theme.dark ? "x-dark" : ""} style={vars}>
      <TiltFx />

      {/* by the numbers */}
      {stats.length >= 3 && (
        <section className="x-numbers pc-in pc-up relative mt-14 overflow-hidden py-12">
          <div className={W}>
            <p className="text-[12px] font-bold uppercase tracking-[.22em] opacity-70">{site.state} by the numbers</p>
            <div className="pc-in pc-stagger mt-5 grid grid-cols-2 gap-y-8 md:grid-cols-3 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: stats.length } as React.CSSProperties}>
              {stats.map(([v, l, pre]) => (
                <div key={l} className="border-l-2 border-[var(--x-acc)] pl-4">
                  <p className={`${theme.head} text-[44px] font-bold leading-none md:text-[54px]`}><CountUp to={v} decimals={pre === "$" ? 2 : 0} prefix={pre} /></p>
                  <p className="mt-1 text-[13.5px] opacity-75">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* around the state, by city */}
      {tabs.length >= 2 && (
        <section className={`${W} pc-in pc-up mt-14`}>
          <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--x-acc)]">Around the state</p>
          <h2 className={`${H} mb-5`}>News from {site.state}&apos;s cities</h2>
          <CityTabs tabs={tabs} />
        </section>
      )}

      {/* in pictures: draggable gallery */}
      {gallery.length >= 4 && (
        <section className="x-gallery pc-in pc-up mt-14 py-12">
          <div className={W}>
            <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--x-acc)]">In pictures</p>
            <h2 className={`${H} mb-6`}>The stories behind the images</h2>
            <DragScroll>
              {gallery.map((a, i) => (
                <a key={a.slug} href={href(a)} className="x-tilt group relative block w-[82%] shrink-0 snap-start overflow-hidden rounded-lg sm:w-[46%] lg:w-[31%]" draggable={false}>
                  <span className="x-zoom block aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.img} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
                  </span>
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,.88))]" />
                  <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="text-[12px] font-bold uppercase tracking-[.14em] opacity-80">{String(i + 1).padStart(2, "0")} · {a.category.replace(/-/g, " ")}</span>
                    <span className={`${theme.head} mt-1 block text-[22px] font-bold leading-tight`}>{a.title}</span>
                  </span>
                </a>
              ))}
            </DragScroll>
          </div>
        </section>
      )}

      {/* the week as a timeline */}
      {days.length >= 2 && (
        <section className={`${W} pc-in pc-up mt-14`}>
          <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--x-acc)]">The week</p>
          <h2 className={`${H} mb-6`}>What happened in {site.state}, day by day</h2>
          <ol className="relative border-l-2 border-[var(--x-line)] pl-8">
            {days.map(([label, list]) => (
              <li key={label} className="pc-in pc-up relative pb-8 last:pb-0">
                <span className="absolute -left-[41px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-[var(--x-bg)] bg-[var(--x-acc)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--x-acc)_25%,transparent)]" />
                <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[var(--x-acc)]">{label}</p>
                <div className="mt-2 grid gap-4 md:grid-cols-3">
                  {list.map((a) => (
                    <a key={a.slug} href={href(a)} className="x-tilt group flex gap-3">
                      {a.img && (
                        <span className="x-zoom h-[64px] w-[88px] shrink-0 overflow-hidden rounded">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.img} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </span>
                      )}
                      <span className="x-title text-[15.5px] font-semibold leading-snug">{a.title}</span>
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* explore the sections */}
      {tiles.length >= 3 && (
        <section className={`${W} pc-in pc-up mt-14`}>
          <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[var(--x-acc)]">Explore</p>
          <h2 className={`${H} mb-6`}>Every section of {site.name}</h2>
          <div className="pc-in pc-stagger grid grid-cols-2 gap-4 lg:grid-cols-6">
            {tiles.map(({ label, slug, a }, i) => (
              <a key={slug} href={`/${slug}`} className={`x-tilt x-glow group relative block overflow-hidden rounded-lg ${spans[i]}`}>
                <span className="x-zoom absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a!.img} alt="" className="h-full w-full object-cover" loading="lazy" />
                </span>
                <span className="absolute inset-0 bg-[linear-gradient(200deg,transparent_30%,rgba(0,0,0,.85))]" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                  <span className={`${theme.head} block text-[26px] font-bold md:text-[34px]`}>{label} →</span>
                  <span className="mt-1 line-clamp-1 block text-[13px] opacity-80">{a!.title}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
