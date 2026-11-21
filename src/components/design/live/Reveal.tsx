"use client";

import { useEffect } from "react";

/**
 * Adds "is-in" to every .lv-reveal element as it scrolls into view, once.
 * One observer for the whole page; without JavaScript the CSS leaves the
 * sections visible only after this runs, so it also marks everything visible
 * if IntersectionObserver is missing.
 */
export default function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lv-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
