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
  const [zoom, setZoom] = useState<string | null>(null);

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
      if (t.tagName === "IMG" && t.closest(".pc-article, article figure, figure")) setZoom((t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src);
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
    {zoom && (
      <button type="button" onClick={() => setZoom(null)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-4" aria-label="Close picture">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={zoom} alt="" className="max-h-full max-w-full object-contain" />
      </button>
    )}
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
