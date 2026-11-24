import { Fraunces, Work_Sans } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { InlineMast } from "../MastheadAlt";
import { logoLeftOf } from "@/config/design-cfg";

import { mockupOf, tint } from "@/config/design-cfg";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Peach" family, first built for Georgia from its generated mockup
 * (21.11.2026): warm cream paper, deep brown ink, peach accent and copper
 * rules; Fraunces headlines, Work Sans for everything else. Different from
 * the Texas "live" family in type, colour, masthead and section layouts.
 */
export const display = Fraunces({ subsets: ["latin"], weight: ["600", "700", "800", "900"], display: "swap", variable: "--pc-display", preload: false });
export const body = Work_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });

export const PEACH: Record<string, { ink: string; acc: string; copper: string; paper: string; slogan: string; capital: string }> = {
  "georgia-express": { ink: "#3a1c14", acc: "#e07a5f", copper: "#b87333", paper: "#fbf6f1", slogan: "From Atlanta to the coast.", capital: "Atlanta" },
};

export function peachOf(site: SiteConfig) {
  const m = mockupOf(site.slug);
  return PEACH[site.slug] || { ink: m?.ink || "#2b2118", acc: m?.acc || site.accent, copper: m?.metal || "#b87333", paper: tint(m?.acc || "#e07a5f", 0.94), slogan: m?.slogan || site.tagline, capital: m?.capital || site.city };
}

export function peachVars(site: SiteConfig) {
  const p = peachOf(site);
  // The live-family components reused here (county search, alerts, menu,
  // share bar) read --lv-ink and --lv-acc, so they take this palette too.
  return {
    ["--pc-ink" as string]: p.ink,
    ["--pc-acc" as string]: p.acc,
    ["--pc-cu" as string]: p.copper,
    ["--pc-paper" as string]: p.paper,
    ["--lv-ink" as string]: p.ink,
    ["--lv-acc" as string]: p.acc,
  } as React.CSSProperties;
}

export const PNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const SearchIcon = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Section heading: small icon, uppercase title, copper rule to the right. */
export function PHead({ icon, children, link, more = "More", light = false }: { icon?: React.ReactNode; children: React.ReactNode; link?: string; more?: string; light?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && <span className={light ? "text-[var(--pc-acc)]" : "text-[var(--pc-acc)]"}>{icon}</span>}
      <h2 className={`text-[18px] font-extrabold uppercase tracking-[.06em] ${light ? "text-white" : "text-[var(--pc-ink)]"}`}>{link ? <a href={link} className="hover:text-[var(--pc-acc)]">{children}</a> : children}</h2>
      <span className={`pc-rule h-px flex-1 ${light ? "bg-white/30" : "bg-[var(--pc-cu)]/50"}`} />
      {link && <a href={link} className="whitespace-nowrap text-[13px] font-semibold text-[var(--pc-acc)] hover:underline">{more} →</a>}
    </div>
  );
}

/** Small line icons used in the section heads (drawn here, no icon font). */
export const Ico = {
  brief: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h10M7 17h6" /></svg>,
  storm: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" /><path d="M14 4c-6 0-10 3-10 8M10 20c6 0 10-3 10-8" strokeLinecap="round" /></svg>,
  pin: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>,
  sun: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" /></svg>,
  pump: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="4" y="3" width="10" height="18" rx="1.5" /><path d="M7 7h4M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8l-3-3" /></svg>,
  dome: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3v2M7 11a5 5 0 0 1 10 0M5 11h14M6 11v8M10 11v8M14 11v8M18 11v8M3 21h18" /></svg>,
  chart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>,
  trophy: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6" /></svg>,
  quote: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></svg>,
  leaf: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14zM5 19l7-7" /></svg>,
  shield: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>,
  cap: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5" /></svg>,
  flame: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z" /></svg>,
  plane: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M10.5 21l1.5-6 7 3V16l-7-5V5a1.5 1.5 0 0 0-3 0v6L2 16v2l7-3 1.5 6" strokeLinejoin="round" /></svg>,
  ball: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>,
};

export function PeachTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--pc-ink)] text-white">
      <div className="mx-auto flex max-w-[1360px] items-center gap-4 px-4 py-2 text-[13px] md:text-[14px]">
        <span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>{today}</span>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-white/25 pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={22} />
            <span className="font-semibold">{capital.city} {capital.temp}°{capital.unit}</span>
            <span className="text-white/70">{capital.short}</span>
          </a>
        )}
        <span className="ml-auto flex items-center gap-4">
          <a href="/#alerts" className="rounded-sm bg-[var(--pc-acc)] px-3 py-1 font-semibold text-[#1d0d08] hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden text-white/85 hover:text-white sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

/** Big centred masthead (homepage) or slim one (article, section). */
export function PeachHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="border-b border-[var(--pc-cu)]/40 bg-[var(--pc-paper)]">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={PNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="max-w-[min(460px,64vw)] object-contain h-[84px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--pc-ink)]"><SearchIcon /></a>
      </div>
      {logoLeftOf(site.slug) ? (
        <InlineMast logo={logo} name={site.name} nav={PNAV} active={active} font={display.className} ink="var(--pc-ink)" />
      ) : (
        <>
      {compact ? (
        <div className="mx-auto hidden max-w-[1360px] items-center gap-6 px-4 md:flex">
          <a href="/" aria-label={site.name} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={240} height={120} className="max-w-[min(460px,64vw)] object-contain h-[104px] w-auto" />
          </a>
          <nav className="flex-1">
            <ul className={`${display.className} flex items-center justify-end gap-7 whitespace-nowrap text-[19px] font-semibold text-[var(--pc-ink)]`}>
              {PNAV.map(([l, h]) => {
                const on = active && h === `/${active}`;
                return (
                  <li key={l}><a href={h} className={`pc-navlink block py-2 ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>
                );
              })}
              <li><a href="/search" aria-label="Search" className="block py-2 hover:text-[var(--pc-acc)]"><SearchIcon s={20} /></a></li>
            </ul>
          </nav>
        </div>
      ) : (
        <>
          <div className="mx-auto hidden max-w-[1360px] px-4 pt-3 text-center md:block">
            <a href="/" aria-label={site.name} className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={site.name} width={340} height={170} className="max-w-[min(460px,64vw)] object-contain mx-auto h-[170px] w-auto" />
            </a>
          </div>
          <nav className="mx-auto hidden max-w-[1360px] border-t border-[var(--pc-cu)]/40 px-4 md:block">
            <ul className={`${display.className} flex items-center justify-center text-[19px] font-semibold text-[var(--pc-ink)]`}>
              {PNAV.map(([l, h], i) => (
                <li key={l} className="flex items-center">
                  {i > 0 && <span className="mx-6 h-5 w-px bg-[var(--pc-cu)]/50" aria-hidden />}
                  <a href={h} className="pc-navlink block whitespace-nowrap py-3">{l}</a>
                </li>
              ))}
              <li className="ml-8"><a href="/search" aria-label="Search" className="block py-3 hover:text-[var(--pc-acc)]"><SearchIcon s={20} /></a></li>
            </ul>
          </nav>
        </>
      )}
        </>
      )}
    </header>
  );
}

export function PeachFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["News", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"]]],
    ["Opinion & Life", [["Opinion", "/opinion"], ["Life", "/life"], ["Search", "/search"]]],
    ["About", [["About us", "/about"], ["Editorial policy", "/editorial-policy"], ["Ethics", "/ethics"], ["Corrections", "/corrections"], ["Careers", "/careers"]]],
    ["Contact", [["Contact the newsroom", "/contact"], ["Advertise", "/advertise"], ["Place an obituary", "/obituaries/submit"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="pc-footer relative mt-12 overflow-hidden bg-[var(--pc-ink)] text-white">
        <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-12 md:grid-cols-[300px_1fr]">
          <div>
            <a href="/" aria-label={site.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={260} height={130} className="h-auto w-[240px]" loading="lazy" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-4">
            {cols.map(([t, links]) => (
              <div key={t}>
                <p className="mb-3 font-bold uppercase tracking-[.08em] text-[var(--pc-acc)]">{t}</p>
                {links.map(([l, h]) => <a key={l} href={h} className="block py-1 text-white/80 hover:text-white">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}
