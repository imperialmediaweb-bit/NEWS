"use client";

import { useEffect, useRef, useState } from "react";

export type BriefItem = { title: string; href: string; section: string; summary: string; image: string; when: string };

/**
 * Vertical feed: one story per screen, swipe (or scroll, or arrow keys) up for
 * the next. Native CSS scroll-snap, so it is smooth on every phone and needs
 * no library. Buttons on the right: read the story, share, copy link.
 */
export default function InBrief({ items, siteName, state, domain, ink, acc }: { items: BriefItem[]; siteName: string; state: string; domain: string; ink: string; acc: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const i = Number((e.target as HTMLElement).dataset.i); setActive(i); if (i > 0) setHint(false); } }), { root: el, threshold: 0.6 });
    el.querySelectorAll("[data-i]").forEach((n) => io.observe(n));
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: "smooth" }); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: "smooth" }); }
      if (e.key === "Escape") location.href = "/";
    };
    document.addEventListener("keydown", k);
    return () => { io.disconnect(); document.removeEventListener("keydown", k); };
  }, []);

  const ago = (d: string) => { if (now === null) return ""; const h = Math.round((now - new Date(d).getTime()) / 3600000); return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`; };
  const url = (it: BriefItem) => `https://${domain}${it.href}`;
  async function share(it: BriefItem, i: number) {
    try {
      if (navigator.share) { await navigator.share({ title: it.title, url: url(it) }); return; }
      await navigator.clipboard.writeText(url(it)); setCopied(i); setTimeout(() => setCopied(null), 1800);
    } catch { /* cancelled */ }
  }

  return (
    <div className="ib" style={{ ["--ib-ink" as string]: ink, ["--ib-acc" as string]: acc } as React.CSSProperties}>
      <header className="ib-top">
        <a href="/" className="ib-close" aria-label={`Back to ${siteName}`}>×</a>
        <b>Express Swipe</b>
        <span>{items.length ? `${active + 1} / ${items.length + 1}` : ""}</span>
      </header>
      <div ref={box} className="ib-feed">
        {items.map((it, i) => (
          <article key={it.href} data-i={i} className="ib-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image} alt="" loading={i < 2 ? "eager" : "lazy"} className={`ib-img${active === i ? " ib-zoom" : ""}`} />
            <div className="ib-shade" />
            <div className="ib-text">
              <span className="ib-sec">{it.section}</span>
              <h2><a href={it.href}>{it.title}</a></h2>
              {it.summary && <p>{it.summary}</p>}
              <em>{siteName}{now !== null && ` · ${ago(it.when)}`}</em>
            </div>
            <div className="ib-btns">
              <a href={it.href} aria-label="Read the full story"><i className="ib-read">▤</i>Read</a>
              <button type="button" onClick={() => share(it, i)} aria-label="Share this story"><i>↗</i>{copied === i ? "Copied" : "Share"}</button>
            </div>
          </article>
        ))}
        <article data-i={items.length} className="ib-item ib-end">
          <h2>You&apos;re all caught up</h2>
          <p>That&apos;s the latest from across {state}. New stories come in all day.</p>
          <a href="/" className="ib-cta">Go to the front page</a>
          <a href="/alerts" className="ib-cta ib-cta2">Get {state} alerts</a>
        </article>
      </div>
      {hint && items.length > 1 && <div className="ib-hint" aria-hidden>↑ Swipe up for the next story</div>}
      <style>{`
.ib{position:fixed;inset:0;z-index:10000;background:#000;color:#fff;font-family:Inter,system-ui,sans-serif}
.ib-top{position:absolute;z-index:5;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 14px;background:linear-gradient(180deg,rgba(0,0,0,.7),transparent)}
.ib-top b{font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:800}
.ib-top span{margin-left:auto;font-size:12px;opacity:.8}
.ib-close{width:40px;height:40px;display:grid;place-items:center;background:rgba(255,255,255,.15);color:#fff;font-size:26px;line-height:1}
.ib-feed{height:100%;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none}
.ib-feed::-webkit-scrollbar{display:none}
.ib-item{position:relative;height:100dvh;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;display:flex;align-items:flex-end;background:var(--ib-ink)}
.ib-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1)}
.ib-zoom{animation:ibZoom 9s ease-out forwards}
@keyframes ibZoom{to{transform:scale(1.1)}}
.ib-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.3) 0%,transparent 28%,rgba(0,0,0,.35) 52%,var(--ib-ink) 100%)}
.ib-text{position:relative;z-index:3;padding:0 86px calc(34px + env(safe-area-inset-bottom,0px)) 18px;max-width:760px}
.ib-sec{display:inline-block;background:var(--ib-acc);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:4px 9px}
.ib-text h2{font-family:Georgia,'Times New Roman',serif;font-weight:800;font-size:clamp(25px,6.6vw,44px);line-height:1.1;margin:10px 0 8px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.ib-text p{font-size:15.5px;line-height:1.5;opacity:.92;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ib-text em{font-style:normal;font-size:12px;opacity:.7}
.ib-btns{position:absolute;z-index:4;right:10px;bottom:calc(34px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:18px}
.ib-btns a,.ib-btns button{display:flex;flex-direction:column;align-items:center;gap:5px;color:#fff;background:none;border:0;cursor:pointer;font-size:11px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.7)}
.ib-btns i{width:50px;height:50px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);font-style:normal;font-size:20px}
.ib-btns .ib-read{background:var(--ib-acc)}
.ib-end{flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px}
.ib-end h2{font-family:Georgia,serif;font-size:32px;margin:0 0 8px}
.ib-end p{opacity:.85;max-width:420px}
.ib-cta{margin-top:18px;background:var(--ib-acc);color:#fff;padding:13px 24px;font-weight:800}
.ib-cta2{margin-top:10px;background:#fff;color:var(--ib-ink)}
.ib-hint{position:absolute;z-index:6;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.25);padding:7px 14px;font-size:12.5px;font-weight:700;white-space:nowrap;animation:ibHint 1.6s ease-in-out infinite}
@keyframes ibHint{50%{transform:translate(-50%,-6px)}}
@media (min-width:768px){.ib-item{justify-content:center}.ib-text{padding-right:18px}}
@media (prefers-reduced-motion:reduce){.ib-zoom,.ib-hint{animation:none}}
`}</style>
    </div>
  );
}
