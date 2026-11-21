"use client";

import { useEffect, useState } from "react";

/** T-minus clock to a launch time; shows the date alone until the page runs. */
export default function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  let s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const cell = (v: number, l: string) => (
    <span className="flex flex-col items-center">
      <span className="min-w-[2ch] text-[44px] font-black leading-none tabular-nums md:text-[60px]">{String(v).padStart(2, "0")}</span>
      <span className="text-[12px] font-bold uppercase tracking-[.14em] text-white/70">{l}</span>
    </span>
  );
  return (
    <div className="flex items-end gap-3 md:gap-5" aria-label="Time to launch">
      <span className="pb-4 text-[22px] font-black text-[var(--tb-gold)]">T-</span>
      {cell(d, "days")}
      <span className="pb-5 text-[36px] font-black text-white/40">:</span>
      {cell(h, "hrs")}
      <span className="pb-5 text-[36px] font-black text-white/40">:</span>
      {cell(m, "min")}
      <span className="pb-5 text-[36px] font-black text-white/40">:</span>
      {cell(s, "sec")}
    </div>
  );
}
