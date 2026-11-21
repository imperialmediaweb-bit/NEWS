import { Newsreader, Source_Sans_3 } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Magazine" family, first built for California from its generated mockup
 * (21.11.2026), in the manner of a monthly magazine's website: large
 * photography, generous white space, elegant Newsreader headlines with
 * italic section titles, Source Sans for text. Navy, orange and gold.
 */
export const serifM = Newsreader({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], display: "swap", variable: "--mg-serif", preload: false });
export const sansM = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });

export const MAG: Record<string, { ink: string; acc: string; gold: string; slogan: string; capital: string }> = {
  "california-express": { ink: "#0d3b66", acc: "#e8833a", gold: "#c9a227", slogan: "From the coast to the Sierra.", capital: "Los Angeles" },
};

export function magOf(site: SiteConfig) {
  return MAG[site.slug] || { ink: "#14213d", acc: site.accent, gold: "#c9a227", slogan: site.tagline, capital: site.city };
}

export function magVars(site: SiteConfig) {
  const m = magOf(site);
  return {
    ["--mg-ink" as string]: m.ink,
    ["--mg-acc" as string]: m.acc,
    ["--mg-gold" as string]: m.gold,
    ["--pc-acc" as string]: m.acc,
    ["--pc-cu" as string]: m.gold,
    ["--pc-ink" as string]: m.ink,
    ["--lv-ink" as string]: m.ink,
    ["--lv-acc" as string]: m.acc,
  } as React.CSSProperties;
}

export const MNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Italic serif section title with a thin gold rule, as in the mockup. */
export function MHead({ children, link, more }: { children: React.ReactNode; link?: string; more?: string }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <h2 className={`${serifM.className} text-[30px] font-semibold italic leading-none text-[var(--mg-ink)]`}>{link ? <a href={link} className="hover:text-[var(--mg-acc)]">{children}</a> : children}</h2>
      <span className="pc-rule h-px flex-1 bg-[var(--mg-gold)]" />
      {link && <a href={link} className="whitespace-nowrap text-[14px] font-semibold text-[var(--mg-ink)] hover:text-[var(--mg-acc)]">{more || "More"} ›</a>}
    </div>
  );
}

/** Small orange capitals above a block, like the mockup's POLITICS / BUSINESS. */
export const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-2 text-[13px] font-bold uppercase tracking-[.14em] text-[var(--mg-acc)]">{children}</p>;

export function MagTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--mg-ink)] text-white">
      <div className={`${serifM.className} mx-auto flex max-w-[1320px] items-center gap-4 px-4 py-1.5 text-[14px]`}>
        <span>{today}</span>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-white/30 pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={22} /> {capital.city} <b>{capital.temp}°{capital.unit}</b> <span className="text-white/70">{capital.short}</span>
          </a>
        )}
        <span className="ml-auto flex items-center gap-4">
          <a href="/#alerts" className="rounded-sm bg-[var(--mg-acc)] px-3 py-0.5 font-semibold hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden text-white/85 hover:text-white sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

export function MagHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={MNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[84px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--mg-ink)]"><Search /></a>
      </div>
      <div className="mx-auto hidden max-w-[1320px] px-4 md:block">
        <div className={`text-center ${compact ? "pt-1" : "pt-3"}`}>
          <a href="/" aria-label={site.name} className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={360} height={180} className={`mx-auto w-auto ${compact ? "h-[110px]" : "h-[170px]"}`} />
          </a>
        </div>
        <nav className="border-b border-[var(--mg-gold)]">
          <ul className={`${serifM.className} relative flex items-center justify-center gap-12 py-3 text-[19px] font-semibold text-[#1a1a1a]`}>
            {MNAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
            })}
            <li className="absolute right-0"><a href="/search" aria-label="Search" className="text-[var(--mg-ink)] hover:text-[var(--mg-acc)]"><Search /></a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function MagFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["About", [["About us", "/about"], ["Editorial policy", "/editorial-policy"], ["Ethics and standards", "/ethics"], ["Corrections", "/corrections"], ["Careers", "/careers"]]],
    ["Contact", [["Contact the newsroom", "/contact"], ["Send a tip", "/contact"], ["Advertise", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-16 bg-[var(--mg-ink)] text-white">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 md:grid-cols-[320px_1fr]">
          <a href="/" aria-label={site.name} className="md:border-r md:border-[var(--mg-gold)]/60 md:pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[260px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className={`${serifM.className} mb-3 text-[19px] font-semibold text-[var(--mg-gold)]`}>{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1320px] border-t border-[var(--mg-gold)]/50 px-4 py-4 text-[13px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}
