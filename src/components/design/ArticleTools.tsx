"use client";

import { useEffect, useState } from "react";

/**
 * Reading tools on every article, whatever the design: listen (the browser's
 * own speech, free), and text size (remembered on this device).
 */
export default function ArticleTools() {
  const [speaking, setSpeaking] = useState(false);
  const [size, setSize] = useState(0);
  const [canSpeak, setCanSpeak] = useState(false);
  const [night, setNight] = useState(false);
  const [gal, setGal] = useState<{ pics: { src: string; cap: string }[]; i: number } | null>(null);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    try {
      const s = Number(localStorage.getItem("express:textsize") || 0);
      if (s) apply(s);
    } catch {
      /* storage blocked: default size */
    }
    try { if (localStorage.getItem("express:night") === "1") toggleNight(true); } catch { /* ignore */ }
    // tap any picture in the story to see it full screen
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName !== "IMG" || !t.closest(".pc-article, article figure, figure")) return;
      // every picture in the story, in page order, so the arrows walk through them
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".pc-article img, article figure img, main figure img"))
        .filter((im, k, all) => all.indexOf(im) === k && im.naturalWidth > 200);
      const pics = imgs.map((im) => ({ src: im.currentSrc || im.src, cap: im.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || im.alt || "" }));
      const i = Math.max(0, imgs.indexOf(t as HTMLImageElement));
      if (pics.length) setGal({ pics, i });
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); try { speechSynthesis.cancel(); } catch { /* none */ } };
  }, []);

  function apply(s: number) {
    setSize(s);
    document.documentElement.style.setProperty("--article-scale", String(1 + s * 0.08));
    try { localStorage.setItem("express:textsize", String(s)); } catch { /* ignore */ }
  }

  function toggleNight(on?: boolean) {
    const v = on ?? !night;
    setNight(v);
    document.documentElement.classList.toggle("read-night", v);
    try { localStorage.setItem("express:night", v ? "1" : "0"); } catch { /* ignore */ }
  }

  function listen() {
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    const body = document.querySelector(".pc-article, article");
    const h1 = document.querySelector("h1")?.textContent || "";
    const text = `${h1}. ${(body?.textContent || "").replace(/\s+/g, " ").trim()}`;
    const u = new SpeechSynthesisUtterance(text.slice(0, 12000));
    u.lang = "en-US";
    u.rate = 1;
    const v = speechSynthesis.getVoices().find((x) => /en-US/.test(x.lang) && /natural|neural|google|samantha|aria|jenny/i.test(x.name));
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    setSpeaking(true);
  }

  const btn = "flex h-11 min-w-11 items-center justify-center gap-1.5 px-3 text-[13px] font-bold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
  return (
    <>
    {gal && <Gallery gal={gal} set={setGal} />}
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-[calc(16px+env(safe-area-inset-right,0px))] z-40 flex items-center overflow-hidden rounded-full bg-[#111827]/90 shadow-lg backdrop-blur print:hidden" role="toolbar" aria-label="Reading tools">
      {canSpeak && (
        <button type="button" onClick={listen} className={btn} aria-pressed={speaking}>
          {speaking ? "■ Stop" : "▶ Listen"}
        </button>
      )}
      <button type="button" onClick={() => toggleNight()} className={btn} aria-pressed={night} aria-label="Night reading">{night ? "☀" : "☾"}</button>
      <button type="button" onClick={() => apply(Math.max(-1, size - 1))} className={btn} aria-label="Smaller text">A−</button>
      <button type="button" onClick={() => apply(Math.min(4, size + 1))} className={btn} aria-label="Larger text">A+</button>
    </div>
    </>
  );
}

function Gallery({ gal, set }: { gal: { pics: { src: string; cap: string }[]; i: number }; set: (g: { pics: { src: string; cap: string }[]; i: number } | null) => void }) {
  const n = gal.pics.length;
  const go = (d: number) => set({ ...gal, i: (gal.i + d + n) % n });
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") set(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", k);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = o; };
  });
  const [x0, setX0] = useState<number | null>(null);
  const p = gal.pics[gal.i];
  const arrow = "absolute top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center bg-white/10 text-[34px] text-white hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
  return (
    <div role="dialog" aria-modal="true" aria-label="Story photos" className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onTouchStart={(e) => setX0(e.touches[0].clientX)}
      onTouchEnd={(e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); setX0(null); }}>
      <div className="flex items-center justify-between px-4 py-3 text-[13px] font-bold uppercase tracking-[.18em] text-white/70">
        <span>{n > 1 ? `${gal.i + 1} / ${n}` : "Photo"}</span>
        <button type="button" onClick={() => set(null)} className="flex h-11 w-11 items-center justify-center text-[26px] hover:bg-white/15" aria-label="Close photos">×</button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-20" onClick={(e) => { if (e.target === e.currentTarget) set(null); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={p.src} src={p.src} alt={p.cap} className="gal-in max-h-full max-w-full object-contain" />
        {n > 1 && <button type="button" onClick={() => go(-1)} className={`${arrow} left-2 md:left-6`} aria-label="Previous photo">‹</button>}
        {n > 1 && <button type="button" onClick={() => go(1)} className={`${arrow} right-2 md:right-6`} aria-label="Next photo">›</button>}
      </div>
      {p.cap && <p className="mx-auto max-w-[900px] px-4 py-4 text-center text-[14px] leading-snug text-white/80">{p.cap}</p>}
      {n > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-4">
          {gal.pics.map((q, k) => (
            <button type="button" key={q.src + k} onClick={() => set({ ...gal, i: k })} aria-label={`Photo ${k + 1}`} className={`h-14 w-20 shrink-0 overflow-hidden border-2 ${k === gal.i ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes galIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}.gal-in{animation:galIn .25s ease-out}`}</style>
    </div>
  );
}
