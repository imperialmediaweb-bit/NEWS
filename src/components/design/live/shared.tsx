import { Source_Serif_4, Libre_Franklin } from "next/font/google";
import type { SiteConfig } from "@/config/site-config";
import type { HomeArticle } from "@/lib/homepage-data";
import type { CityWeather } from "@/lib/local-data";

/** Shared pieces of the "live" family: fonts, palette, icons, top bar, footer. */
export const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });
export const sans = Libre_Franklin({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const PALETTE: Record<string, { ink: string; acc: string }> = {
  "texas-express": { ink: "#002868", acc: "#bf0a30" },
};
export const TZ: Record<string, string> = { Texas: "America/Chicago" };

export function href(a: HomeArticle) {
  const c = (a.category || "news").toLowerCase().replace(/\s+/g, "-");
  return `/${c}/${a.slug}`;
}
export function hour(a: HomeArticle, tz: string) {
  if (!a.iso) return "";
  return new Date(a.iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
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
  const pal = PALETTE[site.slug] || { ink: "#14213d", acc: site.accent };
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
              {[["Contact the newsroom", "/contact"], ["Advertise", "/advertise"], ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => <a key={l} href={h} className="block py-0.5 text-white/80 hover:text-white">{l}</a>)}
            </div>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 text-center text-[12px] text-white/60">© {new Date().getFullYear()} {site.name}. All rights reserved.</div>
      </footer>
    </>
  );
}
