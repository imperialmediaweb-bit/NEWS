import { Spectral, Montserrat } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { artOf } from "@/config/state-art";
import { mockupOf, shade } from "@/config/design-cfg";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Dark premium" family, first built for Arizona from its generated mockup
 * (21.11.2026): near-black pages, copper hairlines and a teal accent,
 * cinematic photos, Spectral headlines and spaced Montserrat capitals —
 * luxury editorial at night.
 */
export const spectral = Spectral({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap", variable: "--dk-serif", preload: false });
export const mont = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });

export const DK: Record<string, { bg: string; panel: string; acc: string; cu: string; deep: string; slogan: string; capital: string; sky: string }> = {
  "arizona-express": { bg: "#120f0e", panel: "#1c1715", acc: "#13959a", cu: "#c0703f", deep: "#5a1f0e", slogan: "News under the desert sun.", capital: "Phoenix", sky: "linear-gradient(180deg,#1b0f0c 0%,#5a1f0e 45%,#c0703f 78%,#e7a25f 100%)" },
};

export function dkOf(site: SiteConfig) {
  const m = mockupOf(site.slug);
  const deep = m?.ink || "#3a1a10";
  const cu = m?.metal || "#c0703f";
  return DK[site.slug] || { bg: shade(deep, 0.82), panel: shade(deep, 0.72), acc: m?.acc || site.accent, cu, deep, slogan: m?.slogan || site.tagline, capital: m?.capital || site.city, sky: `linear-gradient(180deg,${shade(deep, 0.75)} 0%,${deep} 50%,${m?.acc || cu} 100%)` };
}

export function dkVars(site: SiteConfig) {
  const d = dkOf(site);
  return {
    ["--dk-bg" as string]: d.bg,
    ["--dk-panel" as string]: d.panel,
    ["--dk-acc" as string]: d.acc,
    ["--dk-cu" as string]: d.cu,
    ["--dk-deep" as string]: d.deep,
    ["--pc-acc" as string]: d.cu,
    ["--pc-cu" as string]: d.cu,
    ["--pc-ink" as string]: "#f3e9e1",
    ["--lv-ink" as string]: "#f3e9e1",
    ["--lv-acc" as string]: d.acc,
  } as React.CSSProperties;
}

export const DNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

export function DHead({ children, link, more }: { children: React.ReactNode; link?: string; more?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className={`${mont.className} text-[15px] font-semibold uppercase tracking-[.18em] text-[#f3e9e1]`}>{link ? <a href={link} className="hover:text-[var(--dk-acc)]">{children}</a> : children}</h2>
      <span className="pc-rule h-px flex-1 bg-[var(--dk-cu)]/70" />
      {link && <a href={link} className="whitespace-nowrap text-[13px] font-semibold text-[var(--dk-acc)] hover:underline">{more || "More"} →</a>}
    </div>
  );
}

export const DLabel = ({ children }: { children: React.ReactNode }) => <p className={`${mont.className} mb-2 text-[12px] font-semibold uppercase tracking-[.16em] text-[var(--dk-acc)]`}>{children}</p>;

export function DkTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="border-b border-[var(--dk-cu)]/40 bg-[#0b0908] text-[#e9ddd3]">
      <div className={`${mont.className} mx-auto flex max-w-[1340px] items-center gap-4 px-4 py-1.5 text-[13px]`}>
        <span>{today}</span>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-white/20 pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={20} /> {capital.city} {capital.temp}°{capital.unit} <span className="text-white/55">| {capital.short}</span>
          </a>
        )}
        <span className="ml-auto flex items-center gap-3">
          <a href="/#alerts" className="border border-[var(--dk-cu)] bg-[var(--dk-deep)] px-3 py-0.5 font-semibold hover:brightness-125">Get alerts</a>
          <a href="/contact" className="hidden sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

/** Masthead on a desert-dusk sky, the logo in light ink. */
export function DkHeader({ site, MobileMenu, compact = false, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; compact?: boolean; active?: string }) {
  const d = dkOf(site);
  const logo = `/logos/white/${site.slug}.svg`;
  return (
    <header className="bg-[var(--dk-bg)]">
      <div className="flex items-center justify-between px-2 py-1 text-white md:hidden" style={{ background: d.sky }}>
        <MobileMenu nav={DNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[84px] w-auto drop-shadow-[0_2px_12px_rgba(0,0,0,.5)]" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center"><Search /></a>
      </div>
      <div className="relative hidden overflow-hidden md:block" style={artOf(site.slug).sky ? { background: `center / cover no-repeat url(${artOf(site.slug).sky}), ${d.sky}` } : { background: d.sky }}>
        <svg className="absolute inset-x-0 bottom-0 h-16 w-full text-[var(--dk-bg)]" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden><path d="M0 60 L0 38 L90 30 L160 36 L250 18 L330 30 L420 26 L520 40 L640 22 L720 30 L820 14 L900 28 L1010 24 L1100 36 L1180 20 L1260 30 L1360 22 L1440 32 L1440 60 Z" fill="currentColor" /></svg>
        <div className={`relative mx-auto max-w-[1340px] px-4 text-center ${compact ? "py-2" : "py-5"}`}>
          <a href="/" aria-label={site.name} className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={site.name} width={380} height={190} className={`mx-auto w-auto drop-shadow-[0_2px_18px_rgba(0,0,0,.45)] ${compact ? "h-[100px]" : "h-[160px]"}`} />
          </a>
        </div>
      </div>
      <nav className="relative mx-auto hidden max-w-[1340px] border-b border-[var(--dk-cu)]/50 px-4 md:block">
        <ul className={`${mont.className} flex items-center justify-center gap-12 py-3 text-[14px] font-medium uppercase tracking-[.16em] text-[#e9ddd3]`}>
          {DNAV.map(([l, h]) => {
            const on = active && h === `/${active}`;
            return <li key={l}><a href={h} className={`pc-navlink ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>{l}</a></li>;
          })}
        </ul>
        <a href="/search" aria-label="Search" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#e9ddd3] hover:text-[var(--dk-acc)]"><Search /></a>
      </nav>
    </header>
  );
}

export function DkFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["Sections", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["About", [["About us", "/about"], ["Ethics & standards", "/ethics"], ["Corrections", "/corrections"], ["Careers", "/careers"], ["Advertise", "/advertise"]]],
    ["Contact", [["Contact the newsroom", "/contact"], ["Send us a tip", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-16 border-t border-[var(--dk-cu)]/50 bg-[#0b0908] text-[#e9ddd3]">
        <div className="mx-auto grid max-w-[1340px] gap-10 px-4 py-12 md:grid-cols-[300px_1fr]">
          <a href="/" aria-label={site.name} className="md:border-r md:border-[var(--dk-cu)]/40 md:pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[240px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className={`${mont.className} mb-3 text-[12px] font-semibold uppercase tracking-[.18em] text-[var(--dk-cu)]`}>{h}</p>
                {links.map(([l, u]) => <a key={l} href={u} className="block py-0.5 text-white/70 hover:text-white">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1340px] border-t border-white/10 px-4 py-4 text-[12px] text-white/50">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}
