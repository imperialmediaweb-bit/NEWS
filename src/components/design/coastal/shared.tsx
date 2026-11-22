import { Crimson_Pro, Nunito_Sans } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { mockupOf, tint } from "@/config/design-cfg";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Coastal" family, first built for Hawaii from its generated mockup
 * (21.11.2026): airy white pages with sea tones, a hibiscus accent and gold
 * hairlines, light Crimson Pro headlines, Nunito Sans with spaced capitals for
 * labels. Calm and open.
 */
export const crimson = Crimson_Pro({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap", variable: "--co-serif", preload: false });
export const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap", preload: false });

export const CO: Record<string, { ink: string; acc: string; gold: string; sea: string; slogan: string; capital: string }> = {
  "hawaii-express": { ink: "#003c5a", acc: "#d6336c", gold: "#c9a55a", sea: "#e6f3f7", slogan: "Island news, every day.", capital: "Honolulu" },
};

export function coOf(site: SiteConfig) {
  const m = mockupOf(site.slug);
  return CO[site.slug] || { ink: m?.ink || "#0b3c5d", acc: m?.acc || site.accent, gold: m?.metal || "#c9a55a", sea: tint(m?.ink || "#0b3c5d", 0.9), slogan: m?.slogan || site.tagline, capital: m?.capital || site.city };
}

export function coVars(site: SiteConfig) {
  const c = coOf(site);
  return {
    ["--co-ink" as string]: c.ink,
    ["--co-acc" as string]: c.acc,
    ["--co-gold" as string]: c.gold,
    ["--co-sea" as string]: c.sea,
    ["--pc-acc" as string]: c.acc,
    ["--pc-cu" as string]: c.gold,
    ["--pc-ink" as string]: c.ink,
    ["--lv-ink" as string]: c.ink,
    ["--lv-acc" as string]: c.acc,
  } as React.CSSProperties;
}

export const CNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Spaced capitals with a gold hairline, as in the mockup's section labels. */
export function CHead({ children, link, more, icon }: { children: React.ReactNode; link?: string; more?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && <span className="text-[var(--co-acc)]">{icon}</span>}
      <h2 className={`${nunito.className} text-[16px] font-extrabold uppercase tracking-[.16em] text-[var(--co-ink)]`}>{link ? <a href={link} className="hover:text-[var(--co-acc)]">{children}</a> : children}</h2>
      <span className="pc-rule h-px flex-1 bg-[var(--co-gold)]" />
      {link && <a href={link} className="whitespace-nowrap text-[13px] font-bold text-[var(--co-acc)] hover:underline">{more || "More"} ›</a>}
    </div>
  );
}

export function CoTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--co-ink)] text-white">
      <div className={`${nunito.className} mx-auto flex max-w-[1320px] items-center gap-4 px-4 py-1.5 text-[13.5px]`}>
        <span className="font-semibold">{today}</span>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-white/30 pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={20} /> <b>{capital.city}</b> {capital.temp}°{capital.unit} <i className="text-white/70">{capital.short}</i>
          </a>
        )}
        <span className="ml-auto flex items-center gap-3">
          <a href="/#alerts" className="rounded-md bg-[var(--co-acc)] px-3 py-0.5 font-bold hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden rounded-md border border-white/60 px-3 py-0.5 font-semibold sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

export function CoHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="bg-white">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={CNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[84px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--co-ink)]"><Search /></a>
      </div>
      <div className="mx-auto hidden max-w-[1320px] px-4 md:block">
        <div className="text-center">
          <a href="/" aria-label={site.name} className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={380} height={190} className={`mx-auto w-auto ${compact ? "h-[110px]" : "h-[170px]"}`} />
          </a>
        </div>
        <nav className="relative border-y border-[var(--co-gold)]">
          <ul className={`${crimson.className} flex items-center justify-center gap-14 py-2.5 text-[21px] font-medium text-[var(--co-ink)]`}>
            {CNAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
            })}
          </ul>
          <a href="/search" aria-label="Search" className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--co-ink)] hover:text-[var(--co-acc)]"><Search /></a>
        </nav>
      </div>
    </header>
  );
}

export function CoFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["About", [["About us", "/about"], ["Our newsroom", "/about"], ["Careers", "/careers"], ["Corrections", "/corrections"], ["Ethics & standards", "/ethics"]]],
    ["Contact", [["Contact the newsroom", "/submit"], ["Send a tip", "/submit"], ["Advertise", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-16 border-t border-[var(--co-gold)] bg-white">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 md:grid-cols-[300px_1fr]">
          <a href="/" aria-label={site.name} className="md:border-r md:border-[var(--co-gold)] md:pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[240px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[14.5px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className={`${crimson.className} mb-2 text-[20px] font-semibold text-[var(--co-ink)]`}>{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className="block py-0.5 text-[#4a5a66] hover:text-[var(--co-acc)]">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1320px] border-t border-[var(--co-gold)] px-4 py-4 text-[13px] text-[#6b7b86]">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}

/** Small hibiscus capitals above a block. */
export const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[.16em] text-[var(--co-acc)]">{children}</p>;

/**
 * The Hawaiian ʻokina (U+02BB) is missing from these fonts and falls back with
 * gaps around it ("Pā ʻ ia"); the turned comma (U+2018) is the usual web
 * stand-in and sits tight.
 */
export const ok = (s: string) => (s || "").replace(/\u02BB/g, "\u2018");
