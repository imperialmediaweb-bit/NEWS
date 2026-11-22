"use client";

import { useEffect, useState } from "react";

/**
 * Premium page effects shared by every family and every state (Imperial
 * Design, rebuilt without libraries):
 * - a slim sticky bar with the logo and the menu that slides in once the
 *   masthead has scrolled away;
 * - magnetic buttons: slide CTAs and `.x-magnet` links lean toward the pointer;
 * - a back-to-top button with a ring that shows how far down the page is.
 * Fine pointers only for the magnet; nothing moves with reduced motion.
 */
export default function PremiumFx({ logo, name, nav }: { logo: string; name: string; nav: Array<[string, string]> }) {
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShown(y > 520);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-slide-cta], .x-magnet") as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".is-magnet").forEach((m) => {
        if (m !== el) {
          m.classList.remove("is-magnet");
          m.style.translate = "";
        }
      });
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.classList.add("is-magnet");
      el.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px`;
    };
    if (!reduce && fine) document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
  const C = 2 * Math.PI * 20;
  return (
    <>
      <div className={`x-sticky fixed inset-x-0 top-0 z-[80] border-b border-black/10 bg-white/90 backdrop-blur-md transition-transform duration-300 ${shown ? "translate-y-0" : "-translate-y-full"}`} aria-hidden={!shown}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-1.5">
          <a href="/" aria-label={name} tabIndex={shown ? 0 : -1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={name} width={160} height={80} className="h-[44px] w-auto" />
          </a>
          <nav className="ml-auto hidden md:block">
            <ul className="flex items-center gap-6 text-[15px] font-bold text-[#1b1b1b]">
              {nav.map(([l, h]) => <li key={l}><a href={h} tabIndex={shown ? 0 : -1} className="hover:text-[var(--lv-acc)]">{l}</a></li>)}
            </ul>
          </nav>
        </div>
        <div className="h-[3px] bg-[var(--lv-acc)]" style={{ width: `${progress * 100}%` }} />
      </div>
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`x-totop fixed bottom-24 right-4 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--lv-ink)] shadow-[0_10px_30px_-10px_rgba(0,0,0,.45)] transition-all duration-300 md:bottom-8 ${shown ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="3" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--lv-acc)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </>
  );
}

/** The running ribbon of the latest headlines, for any family. */
export function Ticker({ items }: { items: Array<{ href: string; title: string; time: string }> }) {
  if (items.length < 4) return null;
  return (
    <div className="x-ticker border-y border-black/10 bg-white/60">
      <div className="pc-marquee py-2 text-[14px]">
        <div className="pc-marquee-track">
          {[...items, ...items].map((a, i) => (
            <a key={i} href={a.href} aria-hidden={i >= items.length} tabIndex={i >= items.length ? -1 : undefined} className="flex shrink-0 items-center gap-2 px-6 hover:text-[var(--lv-acc)]">
              <span className="font-bold text-[var(--lv-acc)]">{a.time}</span>
              <span className="font-semibold">{a.title}</span>
              <span className="ml-4 text-[var(--lv-acc)]" aria-hidden>◆</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
