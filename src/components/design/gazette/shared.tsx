import { Merriweather, Mulish } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { CenteredMast } from "../MastheadAlt";
import { logoLeftOf } from "@/config/design-cfg";
import { artOf } from "@/config/state-art";

import { mockupOf, tint } from "@/config/design-cfg";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Community gazette" family, first built for Iowa from its generated mockup
 * (21.11.2026): warm paper, deep brown ink and harvest gold, Merriweather
 * headlines with italic section titles, Mulish for text; friendly, county by
 * county.
 */
export const merri = Merriweather({ subsets: ["latin"], weight: ["400", "700", "900"], style: ["normal", "italic"], display: "swap", variable: "--gz-serif", preload: false });
export const mulish = Mulish({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });

export const GZ: Record<string, { ink: string; acc: string; paper: string; slogan: string; capital: string; fips: string }> = {
  "iowa-express": { ink: "#3d2f12", acc: "#d19a00", paper: "#fbf6ea", slogan: "Iowa, every county.", capital: "Des Moines", fips: "19" },
};

export function gzOf(site: SiteConfig) {
  const m = mockupOf(site.slug);
  return GZ[site.slug] || { ink: m?.ink || "#3d2f12", acc: m?.acc || site.accent, paper: tint(m?.acc || "#d19a00", 0.93), slogan: m?.slogan || site.tagline, capital: m?.capital || site.city, fips: "" };
}

export function gzVars(site: SiteConfig) {
  const g = gzOf(site);
  return {
    ["--gz-ink" as string]: g.ink,
    ["--gz-acc" as string]: g.acc,
    ["--gz-paper" as string]: g.paper,
    ["--pc-acc" as string]: g.acc,
    ["--pc-cu" as string]: g.acc,
    ["--pc-ink" as string]: g.ink,
    ["--lv-ink" as string]: g.ink,
    ["--lv-acc" as string]: "#a06f00",
  } as React.CSSProperties;
}

export const GNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Italic serif title with a gold rule and a chevron, as in the mockup. */
export function GHead({ children, link, more, light = false }: { children: React.ReactNode; link?: string; more?: string; light?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className={`${merri.className} text-[24px] font-bold italic leading-none ${light ? "text-[var(--gz-acc)]" : "text-[var(--gz-ink)]"}`}>{link ? <a href={link} className="hover:text-[#a06f00]">{children}</a> : children}</h2>
      <span className="pc-rule h-[2px] flex-1 bg-[var(--gz-acc)]/70" />
      {link && <a href={link} className="whitespace-nowrap text-[13px] font-bold text-[#a06f00] hover:underline">{more || "More"} ›</a>}
    </div>
  );
}

export function GzTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/Chicago";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--gz-ink)] text-[#f6ecd6]">
      <div className={`${mulish.className} mx-auto flex max-w-[1340px] items-center gap-4 px-4 py-1.5 text-[13.5px]`}>
        <span>{today}</span>
        {capital && <a href="/#weather" className="hidden items-center gap-2 border-l border-white/25 pl-4 sm:flex"><WxIcon short={capital.short} isDay={capital.isDay} size={22} /> <b>{capital.city} {capital.temp}°{capital.unit}</b> <span className="text-white/70">{capital.short}</span></a>}
        <span className="ml-auto flex items-center gap-4">
          <a href="/#alerts" className="rounded bg-[var(--gz-acc)] px-3 py-0.5 font-bold text-[#2a2008] hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

export function GzHeader({ site, MobileMenu, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="border-b border-[#e3d3ad] bg-[var(--gz-paper)]">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={GNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[80px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--gz-ink)]"><Search /></a>
      </div>
      {!logoLeftOf(site.slug) ? (
        <CenteredMast logo={logo} name={site.name} nav={GNAV} active={active} font={merri.className} ink="var(--gz-ink)" art={artOf(site.slug).masthead} />
      ) : (
        <>
      <div className="mx-auto hidden max-w-[1340px] items-center gap-8 px-4 py-2 md:flex">
        <a href="/" aria-label={site.name} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={280} height={140} className="h-[118px] w-auto" />
        </a>
        <span className="h-16 w-px bg-[#d9c79d]" aria-hidden />
        <nav className="flex-1">
          <ul className={`${merri.className} flex items-center justify-around text-[18px] font-bold text-[var(--gz-ink)]`}>
            {GNAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
            })}
          </ul>
        </nav>
        <a href="/search" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe3c4] text-[var(--gz-ink)] hover:bg-[var(--gz-acc)]"><Search /></a>
      </div>
        </>
      )}
    </header>
  );
}

export function GzFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    [site.name, [["About us", "/about"], ["Our journalists", "/about"], ["Careers", "/careers"], ["Corrections", "/corrections"], ["Send a tip", "/contact"]]],
    ["Contact", [["Contact the newsroom", "/contact"], ["Advertise", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-16 bg-[var(--gz-ink)] text-[#f6ecd6]">
        <div className="mx-auto grid max-w-[1340px] gap-10 px-4 py-12 md:grid-cols-[300px_1fr]">
          <a href="/" aria-label={site.name} className="md:border-r md:border-white/20 md:pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[240px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[14.5px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className="mb-3 text-[13px] font-extrabold uppercase tracking-[.12em] text-[var(--gz-acc)]">{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}

/** A gold tag with slanted ends, for the section label. */
export function Slant({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-block bg-[linear-gradient(90deg,#a06f00,var(--gz-acc))] px-3 py-0.5 text-[13px] font-extrabold uppercase tracking-wide text-white [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)] ${className}`}>{children}</span>;
}
