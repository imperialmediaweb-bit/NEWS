import { Libre_Caslon_Text, Public_Sans } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Broadsheet" family, first built for New York from its generated mockup
 * (21.11.2026), in the manner of a great morning paper: black ink, one
 * orange accent, gold double rules, Libre Caslon headlines with italic decks,
 * Public Sans for the small print. Dense columns, datelines, "Read more".
 */
export const caslon = Libre_Caslon_Text({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], display: "swap", variable: "--bs-serif", preload: false });
export const pub = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });

export const BS: Record<string, { ink: string; acc: string; gold: string; slogan: string; capital: string; dateline: string }> = {
  "new-york-express": { ink: "#0a0a0a", acc: "#f05a28", gold: "#c8a24a", slogan: "From the city to upstate.", capital: "New York City", dateline: "NEW YORK" },
};

export function bsOf(site: SiteConfig) {
  return BS[site.slug] || { ink: "#0a0a0a", acc: site.accent, gold: "#c8a24a", slogan: site.tagline, capital: site.city, dateline: site.city.toUpperCase() };
}

export function bsVars(site: SiteConfig) {
  const b = bsOf(site);
  return {
    ["--bs-ink" as string]: b.ink,
    ["--bs-acc" as string]: b.acc,
    ["--bs-gold" as string]: b.gold,
    ["--pc-acc" as string]: b.acc,
    ["--pc-cu" as string]: b.gold,
    ["--pc-ink" as string]: b.ink,
    ["--lv-ink" as string]: b.ink,
    ["--lv-acc" as string]: b.acc,
  } as React.CSSProperties;
}

export const BNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Gold double rule, the broadsheet's signature divider. */
export const Double = ({ className = "" }: { className?: string }) => <div className={`border-y-[1.5px] border-[var(--bs-gold)] py-[1.5px] ${className}`} aria-hidden><div className="h-px bg-[var(--bs-gold)]" /></div>;

/** Italic Caslon section title over a short orange rule. */
export function BHead({ children, link, more }: { children: React.ReactNode; link?: string; more?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--bs-gold)] pb-1">
      <h2 className={`${caslon.className} text-[27px] italic leading-none`}>{link ? <a href={link} className="hover:text-[var(--bs-acc)]">{children}</a> : children}</h2>
      {link && <a href={link} className={`${pub.className} text-[13px] font-semibold text-[var(--bs-acc)] hover:underline`}>{more || "More"} ›</a>}
    </div>
  );
}

export const Kick = ({ children }: { children: React.ReactNode }) => <p className={`${pub.className} mb-1 text-[13px] font-bold uppercase tracking-[.06em] text-[var(--bs-acc)]`}>{children}</p>;

export function BsTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="border-b border-[var(--bs-gold)] bg-white">
      <div className={`${pub.className} mx-auto flex max-w-[1340px] items-center gap-4 px-4 py-1.5 text-[13.5px]`}>
        <b>{today}</b>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-[#ccc] pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={20} /> {capital.temp}°{capital.unit} {capital.city}
          </a>
        )}
        <span className="ml-auto flex items-center gap-4">
          <a href="/#alerts" className="bg-[var(--bs-acc)] px-3 py-1 font-semibold text-white hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden font-semibold sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

export function BsHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={BNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[84px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center"><Search /></a>
      </div>
      <div className="mx-auto hidden max-w-[1340px] px-4 md:block">
        <div className="text-center">
          <a href="/" aria-label={site.name} className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={420} height={210} className={`mx-auto w-auto ${compact ? "h-[110px]" : "h-[180px]"}`} />
          </a>
        </div>
        <nav className="relative">
          <ul className={`${caslon.className} flex items-center justify-center gap-11 py-2.5 text-[19px] font-bold`}>
            {BNAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
            })}
          </ul>
          <a href="/search" aria-label="Search" className="absolute right-0 top-1/2 -translate-y-1/2 hover:text-[var(--bs-acc)]"><Search /></a>
        </nav>
        <Double />
      </div>
    </header>
  );
}

export function BsFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["About", [["About us", "/about"], ["Editorial standards", "/editorial-policy"], ["Ethics", "/ethics"], ["Corrections", "/corrections"], ["Careers", "/careers"]]],
    ["Contact", [["News tips", "/contact"], ["General inquiries", "/contact"], ["Advertising", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-14 border-t-4 border-[var(--bs-gold)] bg-[#0a0a0a] text-white">
        <div className="mx-auto grid max-w-[1340px] gap-10 px-4 py-12 md:grid-cols-[320px_1fr]">
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={300} height={150} className="h-auto w-[280px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h} className="border-l border-white/15 pl-5">
                <p className={`${caslon.className} mb-2 text-[18px] font-bold`}>{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className="block py-0.5 text-white/75 hover:text-white">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--bs-gold)]/60 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}
