import { Source_Serif_4, Libre_Franklin } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";
import PreviewLinks from "./PreviewLinks";
import { mockupOf } from "@/config/design-cfg";

/** Shared pieces of the "live" family: fonts, palette, icons, top bar, footer. */
export const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap", preload: false });
export const sans = Libre_Franklin({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });

export const PALETTE: Record<string, { ink: string; acc: string }> = {
  "texas-express": { ink: "#002868", acc: "#bf0a30" },
};
import { TZ } from "@/config/timezones";
export { TZ };

export function href(a: HomeArticle) {
  const c = (a.category || "news").toLowerCase().replace(/\s+/g, "-");
  return `/${c}/${a.slug}`;
}
export function hour(a: HomeArticle, tz: string) {
  if (!a.iso) return "";
  const d = new Date(a.iso);
  // A bare time on an older story reads as today's; past a day, show the date.
  if (Date.now() - d.getTime() > 20 * 3600 * 1000) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz });
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
}
export function ago(a: HomeArticle) {
  if (!a.iso) return a.date;
  const m = Math.round((Date.now() - new Date(a.iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} hr ago` : a.date;
}

export function WxIcon({ short, isDay, size = 28 }: { short: string; isDay: boolean; size?: number }) {
  const s = short.toLowerCase();
  const sun = <circle cx="16" cy="16" r="6" fill="#f2b705" />;
  const rays = isDay ? <g stroke="#f2b705" strokeWidth="2" strokeLinecap="round">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="16" y1="3" x2="16" y2="6.5" transform={`rotate(${a} 16 16)`} />)}</g> : null;
  const moon = <path d="M20 6a9 9 0 1 0 6 14A8 8 0 0 1 20 6z" fill="#9aa7c7" />;
  const cloud = <path d="M9 25h15a5 5 0 0 0 0-10 7 7 0 0 0-13-1A5.5 5.5 0 0 0 9 25z" fill="#b8c2d6" />;
  let body: JSX.Element;
  if (/thunder|storm/.test(s)) body = <>{cloud}<path d="M16 21l-3 6h3l-2 5 6-8h-3l2-3z" fill="#f2b705" /></>;
  else if (/snow|flurr|sleet/.test(s)) body = <>{cloud}<g fill="#7fa7d9"><circle cx="12" cy="29" r="1.6" /><circle cx="18" cy="30" r="1.6" /><circle cx="24" cy="29" r="1.6" /></g></>;
  else if (/rain|shower|drizzle/.test(s)) body = <>{cloud}<g stroke="#3d7ac2" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="27" x2="11" y2="30" /><line x1="18" y1="27" x2="17" y2="30" /><line x1="24" y1="27" x2="23" y2="30" /></g></>;
  else if (/fog|haze|smoke/.test(s)) body = <g stroke="#9aa3b5" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="13" x2="26" y2="13" /><line x1="4" y1="19" x2="28" y2="19" /><line x1="7" y1="25" x2="25" y2="25" /></g>;
  else if (/cloudy|overcast/.test(s) && !/partly|mostly sunny|mostly clear/.test(s)) body = cloud;
  else if (/partly|mostly cloudy|mostly sunny|mostly clear/.test(s)) body = <>{isDay ? <g transform="translate(-4 -4)">{sun}{rays}</g> : <g transform="translate(-4 -4)">{moon}</g>}{cloud}</>;
  else body = isDay ? <>{sun}{rays}</> : moon;
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>{body}</svg>;
}

export function SectionTitle({ children, href: link }: { children: React.ReactNode; href?: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-[19px] font-extrabold uppercase tracking-wide text-[var(--lv-ink)]">{link ? <a href={link} className="hover:text-[var(--lv-acc)]">{children}</a> : children}</h2>
      <span className="h-[2px] flex-1 bg-[var(--lv-acc)]" />
    </div>
  );
}

export const NAV: Array<[string, string]> = [["Local", "/local-news"], ["Politics", "/politics"], ["Business", "/business"], ["Sports", "/sports"], ["Weather", "#weather"], ["Opinion", "/opinion"], ["Life", "/life"]];

export function liveVars(site: SiteConfig) {
  const mk = mockupOf(site.slug);
  const pal = PALETTE[site.slug] || { ink: mk?.ink || "#14213d", acc: mk?.acc || site.accent };
  return { ["--lv-ink" as string]: pal.ink, ["--lv-acc" as string]: pal.acc } as React.CSSProperties;
}

export function LiveTopBar({ site, capital }: { site: SiteConfig; capital?: CityWeather }) {
  const tz = TZ[site.state] || "America/New_York";
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: tz });
  return (
    <>
      {/* slim bar: date and live weather */}
      <div className="bg-[var(--lv-ink)] text-white">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2 text-[13px]">
          <span className="font-semibold">{today}</span>
          {capital && (
            <a href="#weather" className="flex items-center gap-1.5 border-l border-white/25 pl-4">
              <WxIcon short={capital.short} isDay={capital.isDay} size={20} />
              <b>{capital.city} {capital.temp}°{capital.unit}</b>
              <span className="hidden text-white/75 sm:inline">{capital.short}</span>
            </a>
          )}
          <span className="ml-auto hidden gap-5 sm:flex">
            <a href="/contact" className="hover:underline">Contact</a>
            <a href="/advertise" className="rounded-sm bg-[var(--lv-acc)] px-3 py-1 font-semibold">Advertise</a>
          </span>
        </div>
      </div>

    </>
  );
}

export function LiveFooter({ site }: { site: SiteConfig }) {
  const nav = NAV;
  return (
    <>
      <PreviewLinks />
      {/* footer */}
      <footer className="mt-10 bg-[var(--lv-ink)] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 md:grid-cols-[260px_1fr]">
          <a href="/" aria-label={site.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/white/${site.slug}.svg`} alt={site.name} width={260} height={130} className="h-auto w-[240px]" loading="lazy" />
          </a>
          <div className="grid grid-cols-2 gap-6 text-[14px] sm:grid-cols-3">
            <div>
              <p className="mb-2 font-bold uppercase tracking-wide">Sections</p>
              {nav.filter(([, h]) => h.startsWith("/")).map(([l, h]) => <a key={l} href={h} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
            </div>
            <div>
              <p className="mb-2 font-bold uppercase tracking-wide">About</p>
              {[["About us", "/about"], ["Editorial policy", "/editorial-policy"], ["Ethics", "/ethics"], ["Corrections", "/corrections"], ["Careers", "/careers"]].map(([l, h]) => <a key={l} href={h} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
            </div>
            <div>
              <p className="mb-2 font-bold uppercase tracking-wide">Contact</p>
              {[["Contact the newsroom", "/contact"], ["Advertise", "/advertise"], ["Promote your business", "/promote"], ["Place an obituary", "/obituaries/submit"], ["Alerts & closings", "/alerts"], ["Things to do", "/things-to-do"], ["Gas prices", "/gas-prices"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => <a key={l} href={h} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
            </div>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}

/**
 * Topics the menu promises. The pipeline files nearly every story under
 * local-news, so until stories are tagged, a section is built from recent
 * stories whose headline is about it.
 */
export const TOPIC_RE: Record<string, RegExp> = {
  politics: /\b(governor|gov\.|abbott|senat|legislat|lawmaker|congress|election|vote|voter|ballot|mayor|council|commissioner|statehouse|capitol|campaign|republican|democrat|policy|bill)\b/i,
  business: /\b(business|compan|jobs?|hiring|layoff|plant|factory|econom|market|price|sales|retail|store|restaurant|opens?|opening|invest|startup|bank|oil|energy|tax|budget|million|billion)\b/i,
  sports: /\b(game|coach|football|basketball|baseball|soccer|playoff|season|team|athlet|longhorns|aggies|cowboys|texans|rangers|astros|mavericks|spurs|rockets|tournament|championship|win|wins|score)\b/i,
  life: /\b(recipe|food|holiday|festival|museum|art|arts|music|concert|travel|park|parade|celebration|christmas|thanksgiving|zoo|garden|family|community|church|lights)\b/i,
};

/** The compact masthead (logo left, menu right) with the current section underlined. */
export function LiveCompactHeader({ site, active, MobileMenu }: { site: SiteConfig; active?: string; MobileMenu: React.ComponentType<{ nav: Array<[string, string]> }> }) {
  const logo = `/logos/${site.slug}.svg`;
  const search = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><circle cx="10.5" cy="10.5" r="7" /><path d="M16 16l6 6" strokeLinecap="round" /></svg>;
  return (
    <header className="border-b border-[#dde1ea]">
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <MobileMenu nav={NAV} />
        <a href="/" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={200} height={100} className="h-[80px] w-auto" />
        </a>
        <a href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center text-[var(--lv-ink)]">{search}</a>
      </div>
      <div className="mx-auto hidden max-w-[1240px] items-center gap-6 px-4 md:flex">
        <a href="/" aria-label={site.name} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={site.name} width={260} height={130} className="h-[116px] w-auto" />
        </a>
        <span className="h-16 w-px bg-[#cfd4e0]" aria-hidden />
        <nav className="flex-1">
          <ul className={`${serif.className} flex items-center gap-7 whitespace-nowrap text-[19px] font-bold text-[var(--lv-ink)]`}>
            {NAV.map(([l, h]) => {
              const on = active && h === `/${active}`;
              return (
                <li key={l}>
                  <a href={h === "#weather" ? "/#weather" : h} className={`block border-b-[3px] py-2 ${on ? "border-[var(--lv-acc)]" : "border-transparent hover:text-[var(--lv-acc)]"}`} aria-current={on ? "page" : undefined}>{l}</a>
                </li>
              );
            })}
          </ul>
        </nav>
        <a href="/search" aria-label="Search" className="text-[var(--lv-ink)] hover:text-[var(--lv-acc)]">{search}</a>
      </div>
    </header>
  );
}

/**
 * The free photo libraries resize on request; offering 400/800/1200-wide
 * versions lets a phone download a thumbnail instead of the full photo.
 * Other addresses are returned as they are.
 */
export function sized(url: string, w: number): string {
  if (!url) return url;
  if (/\/p\/[a-z0-9-]+-1200\.webp$/.test(url)) return url.replace(/-1200\.webp$/, `-${[400, 600, 900, 1200, 1600].find((x) => x >= w) || 1600}.webp`);
  if (/images\.pexels\.com/.test(url)) return url.replace(/([?&])(w|h|dpr)=\d+/g, "$1").replace(/[?&]+$/, "").replace(/\?&+/, "?") + (url.includes("?") ? "&" : "?") + `w=${w}`;
  if (/images\.unsplash\.com/.test(url)) return url.replace(/([?&])w=\d+/g, "$1").replace(/[?&]+$/, "") + (url.includes("?") ? "&" : "?") + `w=${w}`;
  if (/pixabay\.com\/get\//.test(url) && w <= 640) return url.replace(/_1280(\.\w+)$/, "_640$1");
  return url;
}
export function srcSetOf(url: string): string | undefined {
  // our own R2 copies: p/<id>-1200.webp has siblings at each width
  if (/\/p\/[a-z0-9-]+-1200\.webp$/.test(url || "")) return [400, 600, 900, 1200, 1600].map((w) => `${url.replace(/-1200\.webp$/, `-${w}.webp`)} ${w}w`).join(", ");
  if (!/images\.pexels\.com|images\.unsplash\.com/.test(url || "")) return undefined;
  return [400, 600, 900, 1200, 1600].map((w) => `${sized(url, w)} ${w}w`).join(", ");
}
