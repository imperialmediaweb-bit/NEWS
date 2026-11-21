import { Barlow_Condensed, Barlow } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "../live/PreviewLinks";
import { TZ, WxIcon } from "../live/shared";

/**
 * "Tabloid" family, first built for Florida from its generated mockup
 * (21.11.2026): huge condensed italic capitals, high contrast, slanted
 * labels, teal / coral / gold. Barlow Condensed for headlines, Barlow for
 * text. The effects reuse the pc-* classes driven by PeachFx.
 */
export const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800", "900"], style: ["normal", "italic"], display: "swap", variable: "--tb-cond" });
export const text = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], display: "swap" });

export const TAB: Record<string, { ink: string; acc: string; gold: string; slogan: string; capital: string }> = {
  "florida-express": { ink: "#005f73", acc: "#e5603f", gold: "#e9b44c", slogan: "From the Keys to the Panhandle.", capital: "Miami" },
};

export function tabOf(site: SiteConfig) {
  return TAB[site.slug] || { ink: "#0b2a4a", acc: site.accent, gold: "#e9b44c", slogan: site.tagline, capital: site.city };
}

export function tabVars(site: SiteConfig) {
  const t = tabOf(site);
  return {
    ["--tb-ink" as string]: t.ink,
    ["--tb-acc" as string]: t.acc,
    ["--tb-gold" as string]: t.gold,
    // shared effect classes and reused components read these
    ["--pc-acc" as string]: t.acc,
    ["--pc-cu" as string]: t.gold,
    ["--pc-ink" as string]: t.ink,
    ["--lv-ink" as string]: t.ink,
    ["--lv-acc" as string]: t.acc,
  } as React.CSSProperties;
}

export const TNAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

const Search = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>
);

/** Tabloid section title: big italic capitals with a gold rule after. */
export function THead({ children, link, more, light = false }: { children: React.ReactNode; link?: string; more?: string; light?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className={`${cond.className} text-[34px] font-black uppercase italic leading-none tracking-tight ${light ? "text-white" : "text-[#111]"}`}>{link ? <a href={link} className="hover:text-[var(--tb-acc)]">{children}</a> : children}</h2>
      <span className="pc-rule h-[3px] flex-1 bg-[var(--tb-gold)]" />
      {link && <a href={link} className={`${cond.className} whitespace-nowrap text-[17px] font-bold uppercase italic text-[var(--tb-acc)] hover:underline`}>{more || "More"} »</a>}
    </div>
  );
}

/** Slanted label, like the tabloid's "BREAKING NEWS" tag. */
export function Slant({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`${cond.className} inline-block bg-[var(--tb-acc)] px-3 py-0.5 text-[15px] font-extrabold uppercase italic text-white [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)] ${className}`}>{children}</span>;
}

export function TabTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <div className="bg-[var(--tb-ink)] text-white">
      <div className="mx-auto flex max-w-[1360px] items-center gap-4 px-4 py-1.5 text-[13px] md:text-[14px]">
        <span className="font-semibold">{today}</span>
        {capital && (
          <a href="/#weather" className="hidden items-center gap-2 border-l border-white/30 pl-4 sm:flex">
            <WxIcon short={capital.short} isDay={capital.isDay} size={22} />
            <b>{capital.city}</b> <span>{capital.temp}°{capital.unit}</span> <span className="text-white/70">{capital.short}</span>
          </a>
        )}
        <span className="ml-auto flex items-center gap-4">
          <a href="/#alerts" className="rounded-sm bg-[var(--tb-acc)] px-3 py-0.5 font-bold hover:brightness-110">Get alerts</a>
          <a href="/contact" className="hidden text-white/85 hover:text-white sm:inline">Contact</a>
        </span>
      </div>
    </div>
  );
}

/** Logo left with the slogan, a rule, then the italic menu. Same on every page. */
export function TabHeader({ site, MobileMenu, active }: { site: SiteConfig; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }>; active?: string }) {
  const logo = `/logos/${site.slug}.svg`;
  const t = tabOf(site);
  return (
    <header className="border-b-4 border-[var(--tb-ink)] bg-white">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={TNAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[76px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--tb-ink)]"><Search /></a>
      </div>
      <div className="mx-auto hidden max-w-[1360px] items-center gap-6 px-4 py-2 md:flex">
        <a href="/" aria-label={site.name} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={300} height={150} className="h-[112px] w-auto" />
          <span className="sr-only">{t.slogan}</span>
        </a>
        <span className="h-20 w-[3px] bg-[var(--tb-gold)]" aria-hidden />
        <nav className="flex-1">
          <ul className={`${cond.className} flex items-center justify-between gap-4 whitespace-nowrap text-[26px] font-extrabold italic text-[#111]`}>
            {TNAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return (
                <li key={l}><a href={h} className={`block border-b-4 pb-0.5 ${on ? "border-[var(--tb-acc)] text-[var(--tb-acc)]" : "border-transparent hover:border-[var(--tb-acc)] hover:text-[var(--tb-acc)]"}`} aria-current={on ? "page" : undefined}>{l}</a></li>
              );
            })}
            <li><a href="/search" aria-label="Search" className="block text-[#111] hover:text-[var(--tb-acc)]"><Search /></a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function TabFooter({ site }: { site: SiteConfig }) {
  const cols: Array<[string, Array<[string, string]>]> = [
    ["News", [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "/#weather"], ["Opinion", "/opinion"], ["Life", "/life"]]],
    ["More from us", [["Send us a tip", "/contact"], ["Corrections", "/corrections"], ["About us", "/about"], ["Careers", "/careers"], ["Advertise", "/advertise"]]],
    ["Policies", [["Editorial policy", "/editorial-policy"], ["Ethics", "/ethics"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <>
      <PreviewLinks />
      <footer className="mt-12 border-t-[6px] border-[var(--tb-gold)] bg-[var(--tb-ink)] text-white">
        <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-12 md:grid-cols-[320px_1fr]">
          <div>
            <a href="/" aria-label={site.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={280} height={140} className="h-auto w-[260px]" loading="lazy" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[15px] sm:grid-cols-3">
            {cols.map(([h, links]) => (
              <div key={h}>
                <p className={`${cond.className} mb-3 border-b-2 border-[var(--tb-gold)] pb-1 text-[20px] font-extrabold uppercase italic`}>{h}</p>
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
