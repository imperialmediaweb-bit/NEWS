"use client";

import { Fragment, useEffect } from "react";

/**
 * The page effects of the peach family, rebuilt from Imperial Design without
 * libraries:
 * - SpotlightCard: a soft light follows the pointer over `.pc-spot` cards;
 * - ClipPathReveal / StaggeredGridReveal: `.pc-in` elements get `is-in` once
 *   they scroll into view (photos open like a curtain, grid items arrive one
 *   after another — the delays are in CSS);
 * - a slow parallax on `.pc-parallax` photos.
 * With reduced motion the CSS shows everything at once and nothing moves.
 */
export default function PeachFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Effects that hide content until it scrolls in apply only once this runs,
    // so without JavaScript every paragraph and card is simply there.
    if (!reduce) document.documentElement.classList.add("pcfx");

    // article text: paragraphs, headings, quotes and pictures rise in; bold
    // phrases get a marker sweep when they reach the screen
    const parts = Array.from(document.querySelectorAll<HTMLElement>(".pc-article > *, .pc-article strong, .pc-article b"));
    let io2: IntersectionObserver | null = null;
    if (!reduce && "IntersectionObserver" in window) {
      io2 = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io2?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );
      parts.forEach((el) => io2!.observe(el));
    } else {
      parts.forEach((el) => el.classList.add("is-in"));
    }

    // 3D tilt on story cards, desktop pointers only
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onTilt = (ev: PointerEvent) => {
      const card = (ev.target as HTMLElement | null)?.closest?.(".pc-card") as HTMLElement | null;
      document.querySelectorAll<HTMLElement>(".pc-card.is-tilt").forEach((c) => {
        if (c !== card) {
          c.classList.remove("is-tilt");
          c.style.transform = "";
        }
      });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilt");
      card.style.transform = `perspective(900px) rotateY(${(px * 6).toFixed(2)}deg) rotateX(${(-py * 6).toFixed(2)}deg) translateY(-5px)`;
    };
    if (!reduce && fine) document.addEventListener("pointermove", onTilt, { passive: true });

    const els = Array.from(document.querySelectorAll<HTMLElement>(".pc-in"));
    let io: IntersectionObserver | null = null;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
      );
      els.forEach((e) => io!.observe(e));
    }

    const onMove = (ev: PointerEvent) => {
      const card = (ev.target as HTMLElement | null)?.closest?.(".pc-spot") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      card.style.setProperty("--my", `${ev.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    const par = Array.from(document.querySelectorAll<HTMLElement>(".pc-parallax"));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (const el of par) {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) continue;
          const shift = (r.top + r.height / 2 - window.innerHeight / 2) * -0.06;
          el.style.setProperty("--py", `${shift.toFixed(1)}px`);
        }
      });
    };
    if (!reduce && par.length) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      io?.disconnect();
      io2?.disconnect();
      document.removeEventListener("pointermove", onTilt);
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}

/** SplitTextReveal: the headline arrives word by word (CSS only). */
export function SplitWords({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`pc-split ${className}`}>
      {text.split(/\s+/).map((w, i) => (
        <Fragment key={i}>
          <span className="pc-w" style={{ ["--i" as string]: i } as React.CSSProperties}>{w}</span>{" "}
        </Fragment>
      ))}
    </span>
  );
}
