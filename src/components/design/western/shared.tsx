import { Zilla_Slab, Alfa_Slab_One, Lora } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { mockupOf, tint } from "@/config/design-cfg";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Western heritage" family, first built for Montana from its generated
 * mockup (21.11.2026): textured paper, wood-type section banners (Alfa Slab
 * One) on navy, Zilla Slab headlines, Lora text, amber accents, a mountain
 * ridge drawn in the masthead and a landscape above the footer.
 */
export const zilla = Zilla_Slab({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap", variable: "--ws-slab", preload: false });
export const alfa = Alfa_Slab_One({ subsets: ["latin"], weight: ["400"], display: "swap", preload: false });
export const lora = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap", preload: false });

export const WS: Record<string, { ink: string; acc: string; gold: string; paper: string; slogan: string; capital: string; dateline: string }> = {
  "montana-express": { ink: "#1b3a4b", acc: "#d18a04", gold: "#b8862b", paper: "#f4ecdc", slogan: "Big Sky news.", capital: "Billings", dateline: "HELENA" },
};

export function wsOf(site: SiteConfig) {
  const m = mockupOf(site.slug);
  return WS[site.slug] || { ink: m?.ink || "#1b3a4b", acc: m?.acc || site.accent, gold: m?.metal || "#b8862b", paper: tint(m?.acc || "#d18a04", 0.9), slogan: m?.slogan || site.tagline, capital: m?.capital || site.city, dateline: (m?.capital || site.city).toUpperCase() };
}

export function wsVars(site: SiteConfig) {
  const w = wsOf(site);
  return {
    ["--ws-ink" as string]: w.ink,
    ["--ws-acc" as string]: w.acc,
    ["--ws-gold" as string]: w.gold,
    ["--ws-paper" as string]: w.paper,
    ["--pc-acc" as string]: w.acc,
    ["--pc-cu" as string]: w.gold,
    ["--pc-ink" as string]: w.ink,
    ["--lv-ink" as string]: w.ink,
    ["--lv-acc" as string]: w.acc,
  } as React.CSSProperties;
}

export const WNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** The mountain ridge used in the masthead and on section banners. */
export const Ridge = ({ className = "", stroke = "currentColor" }: { className?: string; stroke?: string }) => (
  <svg viewBox="0 0 600 90" className={className} aria-hidden preserveAspectRatio="none">
    <path d="M0 88 L60 52 L95 66 L150 20 L190 48 L230 30 L280 64 L330 14 L370 44 L410 28 L470 62 L520 34 L560 54 L600 40" fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    <path d="M150 20 L165 34 L172 30 L185 44 M330 14 L345 30 L352 26 L366 40 M520 34 L532 44 L540 40" fill="none" stroke={stroke} strokeWidth="1.4" opacity=".7" />
    <path d="M0 90 L80 70 L140 78 L220 60 L300 76 L380 58 L460 74 L540 62 L600 70 L600 90 Z" fill={stroke} opacity=".08" />
  </svg>
);

/** Wood-type banner: navy band, amber-cream letters, a ridge on the right. */
export function WHead({ children, link, more, sub }: { children: React.ReactNode; link?: string; more?: string; sub?: string }) {
  return (
    <div className="relative mb-4 flex items-center gap-3 overflow-hidden bg-[var(--ws-ink)] px-4 py-2 text-[#f4ecdc]">
      <h2 className={`${alfa.className} text-[22px] uppercase leading-none tracking-wide md:text-[24px]`}>{link ? <a href={link} className="hover:text-[var(--ws-acc)]">{children}</a> : children}</h2>
      {sub && <span className={`${lora.className} hidden border-l border-white/30 pl-3 text-[14px] italic text-white/80 sm:inline`}>{sub}</span>}
      {link && <a href={link} className={`${lora.className} relative z-10 ml-auto text-[13px] italic text-[var(--ws-acc)] hover:underline`}>{more || "More"} →</a>}
      <Ridge className="pointer-events-none absolute -right-4 bottom-0 h-full w-48 opacity-40" stroke="#f4ecdc" />
    </div>
  );
}

/** Amber capitals over an amber rule, for lighter blocks. */
export function WKick({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <p className={`${alfa.className} text-[20px] uppercase leading-none text-[var(--ws-acc)]`}>{children}</p>
      <span className="pc-rule h-[2px] flex-1 bg-[var(--ws-acc)]/60" />
    </div>
  );
}

export function WsTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/Denver";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--ws-ink)] text-[#f4ecdc]">
      <div className={`${lora.className} mx-auto flex max-w-[1340px] items-center gap-4 px-4 py-1.5 text-[13.5px]`}>
        <span>{today}</span>
        <span className="ml-auto flex items-center gap-4">
          {capital && <a href="/#weather" className="hidden items-center gap-2 sm:flex">{capital.city} <b className="text-[16px]">{capital.temp}°</b><WxIcon short={capital.short} isDay={capital.isDay} size={22} /></a>}
          <a href="/#alerts" className="bg-[var(--ws-acc)] px-3 py-0.5 font-semibold text-[#1b1b1b] hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden italic underline sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

export function WsHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  return (
    <header className="ws-paper border-b-2 border-[var(--ws-acc)]/50">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={WNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[84px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--ws-ink)]"><Search /></a>
      </div>
      <div className="mx-auto hidden max-w-[1340px] grid-cols-[auto_1fr] items-end gap-8 px-4 md:grid">
        <a href="/" aria-label={site.name} className="py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={300} height={150} className={`w-auto ${compact ? "h-[104px]" : "h-[150px]"}`} />
        </a>
        <div className="flex flex-col justify-end">
          {!compact && <Ridge className="h-[90px] w-full text-[var(--ws-ink)]/70" />}
          <nav className="flex items-center justify-end gap-1 pb-3">
            <ul className={`${zilla.className} flex items-center text-[20px] font-bold text-[var(--ws-ink)]`}>
              {WNAV.map(([l, h], i) => {
                const on = active && h === `/${active}`;
                return (
                  <li key={l} className="flex items-center">
                    {i > 0 && <span className="mx-4 h-5 w-px bg-[var(--ws-ink)]/25" aria-hidden />}
                    <a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a>
                  </li>
                );
              })}
            </ul>
            <span className="mx-4 h-5 w-px bg-[var(--ws-ink)]/25" aria-hidden />
            <a href="/search" aria-label="Search" className="text-[var(--ws-ink)] hover:text-[var(--ws-acc)]"><Search /></a>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function WsFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["About", [["About us", "/about"], ["Journalistic standards", "/editorial-policy"], ["Corrections", "/corrections"], ["Careers", "/careers"]]],
    ["Contact", [["Contact the newsroom", "/contact"], ["Send a tip", "/contact"], ["Advertise", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      {/* the landscape above the footer */}
      <div className="mt-16 h-[120px] w-full bg-[linear-gradient(180deg,#f4ecdc_0%,#f6d9a8_45%,#e9a95b_100%)]" aria-hidden>
        <svg viewBox="0 0 1440 120" className="h-full w-full" preserveAspectRatio="none">
          <path d="M0 120 L0 70 L120 40 L210 66 L320 22 L420 58 L520 30 L640 64 L760 18 L880 56 L980 34 L1100 62 L1220 26 L1330 54 L1440 40 L1440 120 Z" fill="#5d6f7a" opacity=".55" />
          <path d="M0 120 L0 92 L160 72 L300 90 L460 70 L620 92 L780 74 L940 94 L1100 76 L1260 92 L1440 80 L1440 120 Z" fill="#1b3a4b" />
        </svg>
      </div>
      <footer className="bg-[var(--ws-ink)] text-[#f4ecdc]">
        <div className="mx-auto grid max-w-[1340px] gap-10 px-4 py-12 md:grid-cols-[300px_1fr]">
          <a href="/" aria-label={site.name} className="md:border-r md:border-white/20 md:pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[240px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[14.5px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className={`${alfa.className} mb-3 text-[15px] uppercase tracking-wide text-[var(--ws-acc)]`}>{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className={`${lora.className} block py-0.5 text-white/80 hover:text-white`}>{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}

/** A thin amber double rule (the western take on the broadsheet rule). */
export const WRule = ({ className = "" }: { className?: string }) => <div className={`border-y border-[var(--ws-acc)]/60 py-[2px] ${className}`} aria-hidden><div className="h-px bg-[var(--ws-acc)]/60" /></div>;
