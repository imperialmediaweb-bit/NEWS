"use client";

import { useEffect, useRef, useState } from "react";

type Story = { title: string; slug: string; category: string; image: string; published_at: string };

/**
 * Phone only: a "Today's stories" button on the homepage that opens the day's
 * stories full screen, one card at a time, in the paper's colours. Tap the
 * right side or swipe left for the next one; each card moves on by itself
 * after a few seconds; "Read the story" opens the article.
 */
export default function StoryCards({ ink, acc, state }: { ink: string; acc: string; state: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [i, setI] = useState<number | null>(null);
  const [t, setT] = useState(0);
  const x0 = useRef<number | null>(null);
  const DUR = 6000;

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    fetch("/api/stories").then((r) => r.json()).then((d) => setStories(d.stories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (i === null) return;
    setT(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = (Date.now() - start) / DUR;
      if (p >= 1) { clearInterval(id); next(); } else setT(p);
    }, 60);
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { clearInterval(id); document.body.style.overflow = o; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  function next() { setI((v) => (v === null || v + 1 >= stories.length ? null : v + 1)); }
  function prev() { setI((v) => (v === null ? null : Math.max(0, v - 1))); }

  if (stories.length < 3) return null;
  const s = i === null ? null : stories[i];
  const ago = (d: string) => { const h = Math.round((Date.now() - new Date(d).getTime()) / 3600000); return h < 1 ? "Just now" : `${h}h ago`; };

  return (
    <>
      {i === null && (
        <button type="button" onClick={() => setI(0)} className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-4 z-40 flex items-center gap-2 py-1.5 pl-1.5 pr-4 text-[13px] font-bold text-white shadow-lg md:hidden" style={{ background: ink }} aria-label={`Open today's ${state} stories`}>
          <span className="relative block h-9 w-9 overflow-hidden" style={{ boxShadow: `0 0 0 2px ${acc}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stories[0].image} alt="" className="h-full w-full object-cover" />
          </span>
          Today&apos;s stories <span className="opacity-70">{stories.length}</span>
        </button>
      )}
      {s && (
        <div role="dialog" aria-modal="true" aria-label={`Today's ${state} stories`} className="fixed inset-0 z-[10000] flex flex-col text-white md:hidden" style={{ background: ink }}
          onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (x0.current === null) return; const dx = e.changedTouches[0].clientX - x0.current; x0.current = null; if (Math.abs(dx) > 50) (dx < 0 ? next : prev)(); }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={s.image} src={s.image} alt="" className="sc-in absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 25%, transparent 40%, ${ink} 85%)` }} />
          <div className="relative flex gap-1 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))]">
            {stories.map((_, k) => (
              <span key={k} className="h-[3px] flex-1 overflow-hidden bg-white/30">
                <span className="block h-full bg-white" style={{ width: k < i! ? "100%" : k === i ? `${t * 100}%` : "0%" }} />
              </span>
            ))}
          </div>
          <div className="relative flex items-center justify-between px-3 py-2 text-[12px] font-bold uppercase tracking-[.18em]">
            <span>{state} · {ago(s.published_at)}</span>
            <button type="button" onClick={() => setI(null)} className="flex h-11 w-11 items-center justify-center text-[28px]" aria-label="Close stories">×</button>
          </div>
          <button type="button" onClick={prev} className="absolute bottom-40 left-0 top-20 w-1/3" aria-label="Previous story" />
          <button type="button" onClick={next} className="absolute bottom-40 right-0 top-20 w-2/3" aria-label="Next story" />
          <div key={s.slug} className="sc-up relative mt-auto px-5 pb-[calc(28px+env(safe-area-inset-bottom,0px))]">
            <span className="inline-block px-2 py-1 text-[11px] font-black uppercase tracking-[.2em]" style={{ background: acc }}>{s.category.replace(/-/g, " ")}</span>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.12]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{s.title}</h2>
            <a href={`/${s.category}/${s.slug}`} className="mt-5 flex h-12 items-center justify-center bg-white text-[15px] font-black uppercase tracking-wider" style={{ color: ink }}>Read the story ›</a>
          </div>
          <style>{`@keyframes scIn{from{transform:scale(1.12)}to{transform:scale(1)}}.sc-in{animation:scIn 6s ease-out forwards}@keyframes scUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}.sc-up{animation:scUp .45s ease-out}@media (prefers-reduced-motion:reduce){.sc-in,.sc-up{animation:none}}`}</style>
        </div>
      )}
    </>
  );
}
