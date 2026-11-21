"use client";

import { useEffect, useState } from "react";

/** A thin bar across the top of the window showing how far into the story the reader is. */
export default function ReadingProgress({ target }: { target: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, -r.top / Math.max(1, total))));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [target]);
  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-[4px] bg-transparent" aria-hidden>
      <div className="h-full bg-[var(--lv-acc)] transition-[width] duration-100" style={{ width: `${p * 100}%` }} />
    </div>
  );
}
