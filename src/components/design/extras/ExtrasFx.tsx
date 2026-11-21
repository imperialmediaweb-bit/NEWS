"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client effects for the premium sections shared by every family:
 * - CountUp: a number counts up when it scrolls into view;
 * - CityTabs: tabs that switch between cities' stories;
 * - DragScroll: a sideways gallery that can be dragged with the mouse;
 * - the 3D tilt on `.x-tilt` cards (pointer driven).
 * With reduced motion the numbers are shown at once and nothing tilts.
 */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setV(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

export function CityTabs({ tabs, className = "" }: { tabs: Array<{ city: string; items: Array<{ href: string; title: string; img: string; when: string }> }>; className?: string }) {
  const [i, setI] = useState(0);
  const cur = tabs[i];
  if (!cur) return null;
  return (
    <div className={className}>
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {tabs.map((t, k) => (
          <button key={t.city} role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`x-tab shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[14px] font-semibold transition ${k === i ? "is-on" : ""}`}>{t.city}</button>
        ))}
      </div>
      <div key={cur.city} className="x-fade grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="tabpanel">
        {cur.items.map((a) => (
          <a key={a.href} href={a.href} className="x-tilt group block">
            <span className="x-zoom block aspect-[4/3] overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.img ? <img src={a.img} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="block h-full w-full bg-[var(--x-acc)]/20" />}
            </span>
            <span className="x-title mt-2 block text-[17px] font-semibold leading-snug">{a.title}</span>
            <span className="text-[12px] opacity-60">{a.when}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function DragScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false, x0 = 0, s0 = 0, moved = false;
    const md = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add("is-drag"); };
    const mm = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = s0 - dx; };
    const mu = () => { down = false; el.classList.remove("is-drag"); };
    const click = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    el.addEventListener("pointerdown", md);
    window.addEventListener("pointermove", mm);
    window.addEventListener("pointerup", mu);
    el.addEventListener("click", click, true);
    return () => { el.removeEventListener("pointerdown", md); window.removeEventListener("pointermove", mm); window.removeEventListener("pointerup", mu); el.removeEventListener("click", click, true); };
  }, []);
  const by = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className={`x-drag flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 pb-3 ${className}`}>{children}</div>
      <div className="mt-3 flex justify-end gap-2">
        <button aria-label="Previous" onClick={() => by(-1)} className="x-arrow flex h-10 w-10 items-center justify-center rounded-full border">‹</button>
        <button aria-label="Next" onClick={() => by(1)} className="x-arrow flex h-10 w-10 items-center justify-center rounded-full border">›</button>
      </div>
    </div>
  );
}

/** 3D tilt for `.x-tilt` cards; mounted once per page. */
export function TiltFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) return;
    const on = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.(".x-tilt") as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".x-tilt.is-tilt").forEach((c) => { if (c !== card) { c.classList.remove("is-tilt"); c.style.transform = ""; } });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilt");
      card.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-4px)`;
    };
    document.addEventListener("pointermove", on, { passive: true });
    return () => document.removeEventListener("pointermove", on);
  }, []);
  return null;
}
