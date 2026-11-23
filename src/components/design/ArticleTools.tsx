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

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    try {
      const s = Number(localStorage.getItem("express:textsize") || 0);
      if (s) apply(s);
    } catch {
      /* storage blocked: default size */
    }
    return () => { try { speechSynthesis.cancel(); } catch { /* none */ } };
  }, []);

  function apply(s: number) {
    setSize(s);
    document.documentElement.style.setProperty("--article-scale", String(1 + s * 0.08));
    try { localStorage.setItem("express:textsize", String(s)); } catch { /* ignore */ }
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
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-[calc(16px+env(safe-area-inset-right,0px))] z-40 flex items-center overflow-hidden rounded-full bg-[#111827]/90 shadow-lg backdrop-blur print:hidden" role="toolbar" aria-label="Reading tools">
      {canSpeak && (
        <button type="button" onClick={listen} className={btn} aria-pressed={speaking}>
          {speaking ? "■ Stop" : "▶ Listen"}
        </button>
      )}
      <button type="button" onClick={() => apply(Math.max(-1, size - 1))} className={btn} aria-label="Smaller text">A−</button>
      <button type="button" onClick={() => apply(Math.min(4, size + 1))} className={btn} aria-label="Larger text">A+</button>
    </div>
  );
}
