"use client";

import { useEffect, useRef, useState } from "react";
import { subscribePush } from "@/lib/push-client";

export type BriefItem = { id: number; title: string; href: string; section: string; summary: string; image: string; when: string };

const EMOJI = ["❤️", "😮", "😢", "😡", "👍"];

/**
 * Express Swipe, the same feed as the Expres network's "Pe scurt": one story
 * per screen, swipe up for the next (native CSS scroll-snap). On every story:
 * emoji reactions with real counts, Read / Facebook / X / Text / Link buttons.
 * Relaxing background music (our own track, no rights issues) on a tap, kept
 * quiet and remembered. A "get alerts" box after every 10 stories and on the
 * end screen, never for readers who already allowed or blocked notifications;
 * "Not now" hides it for 3 days.
 */
export default function InBrief({ items, siteName, state, domain, ink, acc }: { items: BriefItem[]; siteName: string; state: string; domain: string; ink: string; acc: string }) {
  const box = useRef<HTMLDivElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, Record<string, number>>>({});
  const [mine, setMine] = useState<Record<number, string>>({});
  const [withMusic, setWithMusic] = useState(false);
  const [alerts, setAlerts] = useState<"hidden" | "offer" | "working" | "done">("hidden");
  const [askBox, setAskBox] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }), { root: el, threshold: 0.6 });
    el.querySelectorAll("[data-i]").forEach((n) => io.observe(n));
    const hide = () => setHint(false);
    el.addEventListener("scroll", hide, { once: true, passive: true });
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); el.scrollBy({ top: el.clientHeight, behavior: "smooth" }); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); el.scrollBy({ top: -el.clientHeight, behavior: "smooth" }); }
      if (e.key === "Escape") location.href = "/";
    };
    document.addEventListener("keydown", k);
    return () => { io.disconnect(); document.removeEventListener("keydown", k); };
  }, []);

  // reactions: real counts from the server, this reader's own picks from the browser
  useEffect(() => {
    if (!items.length) return;
    fetch(`/api/reactions?ids=${items.map((a) => a.id).join(",")}`).then((r) => r.json()).then((j) => setCounts(j.reactions || {})).catch(() => {});
    try { setMine(JSON.parse(localStorage.getItem("xs-reactions") || "{}")); } catch { /* no storage */ }
  }, [items]);
  async function react(id: number, e: string) {
    const next = { ...mine, [id]: e }; setMine(next);
    try { localStorage.setItem("xs-reactions", JSON.stringify(next)); } catch { /* no storage */ }
    try {
      const j = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, e }) }).then((r) => r.json());
      if (j.reactions) setCounts((c) => ({ ...c, [id]: j.reactions }));
    } catch { /* offline */ }
  }

  // music: starts only on a tap (phones block sound otherwise); remembered
  function toggleMusic() {
    const el = music.current; if (!el) return;
    if (withMusic) { el.pause(); setWithMusic(false); try { localStorage.setItem("xs-music", "0"); } catch { /* */ } return; }
    el.volume = 0.18;
    el.play().then(() => { setWithMusic(true); try { localStorage.setItem("xs-music", "1"); } catch { /* */ } }).catch(() => setWithMusic(false));
  }
  useEffect(() => {
    let wants = false; try { wants = localStorage.getItem("xs-music") === "1"; } catch { /* */ }
    if (!wants) return;
    const first = () => { const el = music.current; if (!el) return; el.volume = 0.18; el.play().then(() => setWithMusic(true)).catch(() => {}); };
    window.addEventListener("pointerdown", first, { once: true });
    return () => window.removeEventListener("pointerdown", first);
  }, []);

  // alerts offer
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    let later = 0; try { later = Number(localStorage.getItem("xs-alerts-later") || 0); } catch { /* */ }
    if (Date.now() - later < 3 * 86400000) return;
    setAlerts("offer");
  }, []);
  useEffect(() => { if (alerts === "offer" && active > 0 && active % 10 === 9) setAskBox(true); }, [active, alerts]);
  async function turnOnAlerts() {
    setAlerts("working");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setAlerts("hidden"); setAskBox(false); return; }
      setAlerts((await subscribePush()) ? "done" : "hidden");
      setTimeout(() => setAskBox(false), 2200);
    } catch { setAlerts("hidden"); setAskBox(false); }
  }
  function notNow() { setAskBox(false); setAlerts("hidden"); try { localStorage.setItem("xs-alerts-later", String(Date.now())); } catch { /* */ } }

  const ago = (d: string) => { if (now === null) return ""; const h = Math.round((now - new Date(d).getTime()) / 3600000); return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`; };
  const url = (it: BriefItem) => `https://${domain}${it.href}`;
  async function copy(it: BriefItem) {
    try { await navigator.clipboard.writeText(url(it)); setCopied(it.id); setTimeout(() => setCopied(null), 1800); } catch { /* no clipboard */ }
  }
  const next = () => box.current?.scrollBy({ top: box.current.clientHeight, behavior: "smooth" });

  return (
    <div className="ib" style={{ ["--ib-ink" as string]: ink, ["--ib-acc" as string]: acc } as React.CSSProperties}>
      <header className="ib-top">
        <a href="/" className="ib-close" aria-label={`Back to ${siteName}`}>×</a>
        <b>Express Swipe</b>
        <button type="button" className={`ib-music${withMusic ? " ib-music-on" : ""}`} onClick={toggleMusic} aria-pressed={withMusic} aria-label={withMusic ? "Turn off the relaxing music" : "Turn on relaxing music"}>🎵</button>
        <span>{items.length ? `${active + 1} / ${items.length + 1}` : ""}</span>
        <audio ref={music} src="/sounds/relax-v1.mp3" loop preload="none" />
      </header>
      {/* desktop: the current photo, blurred, fills the sides around the phone-shaped column */}
      {items[Math.min(active, items.length - 1)] && <div aria-hidden className="ib-bg" style={{ backgroundImage: `url("${items[Math.min(active, items.length - 1)].image}")` }} />}
      <div ref={box} className="ib-feed">
        {items.map((it, i) => (
          <article key={it.href} data-i={i} className="ib-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image} alt="" loading={i < 2 ? "eager" : "lazy"} className={`ib-img${active === i ? " ib-zoom" : ""}`} />
            <div className="ib-shade" />
            <div className="ib-react" role="group" aria-label="Reactions">
              {EMOJI.map((e) => (
                <button key={e} type="button" className={mine[it.id] === e ? "is-on" : ""} onClick={() => react(it.id, e)} aria-label={`React ${e}`} aria-pressed={mine[it.id] === e}>
                  <span>{e}</span>{counts[it.id]?.[e] ? <b>{counts[it.id][e]}</b> : null}
                </button>
              ))}
            </div>
            <div className="ib-text">
              <span className="ib-sec">{it.section}</span>
              <h2><a href={it.href}>{it.title}</a></h2>
              {it.summary && <p>{it.summary}</p>}
              <em>{siteName}{now !== null && ` · ${ago(it.when)}`}</em>
            </div>
            <nav className="ib-btns" aria-label="Story actions">
              <a href={it.href}><i className="ib-read">▤</i>Read</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url(it))}`} target="_blank" rel="noopener noreferrer"><i>f</i>Share</a>
              <a href={`https://x.com/intent/post?text=${encodeURIComponent(it.title)}&url=${encodeURIComponent(url(it))}`} target="_blank" rel="noopener noreferrer"><i>𝕏</i>Post</a>
              <a href={`sms:?&body=${encodeURIComponent(`${it.title} ${url(it)}`)}`}><i>✉</i>Text</a>
              <button type="button" onClick={() => copy(it)}><i>🔗</i>{copied === it.id ? "Copied!" : "Link"}</button>
            </nav>
          </article>
        ))}
        <article data-i={items.length} className="ib-item ib-end">
          <h2>You&apos;re all caught up</h2>
          <p>That&apos;s the latest from across {state}. New stories come in all day.</p>
          <a href="/" className="ib-cta">All the news on {siteName}</a>
          {(alerts === "offer" || alerts === "working") && <button type="button" className="ib-cta ib-cta2" onClick={turnOnAlerts} disabled={alerts === "working"}>🔔 Get the big {state} stories on your phone</button>}
          {alerts === "done" && <p className="ib-done">Done! You&apos;ll get the big stories as they break.</p>}
        </article>
      </div>
      {askBox && alerts !== "hidden" && (
        <div className="ib-ask" role="dialog" aria-label="Turn on alerts">
          {alerts === "done" ? <b>Done! You&apos;ll get the big stories as they break. 🔔</b> : (<>
            <b>🔔 Want to know first?</b>
            <p>Get the big {state} stories from {siteName} on your phone, no more than 2 a day. Free, no account.</p>
            <div><button type="button" onClick={turnOnAlerts} disabled={alerts === "working"}>Yes, turn on</button><button type="button" className="ib-ask-no" onClick={notNow}>Not now</button></div>
          </>)}
        </div>
      )}
      {hint && items.length > 1 && <button type="button" className="ib-hint" onClick={next}>↑ Swipe up for the next story</button>}
      <style dangerouslySetInnerHTML={{ __html: `
.ib{position:fixed;inset:0;z-index:10000;background:#000;color:#fff;font-family:Inter,system-ui,sans-serif}
.ib-top{position:absolute;z-index:5;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 14px;background:linear-gradient(180deg,rgba(0,0,0,.7),transparent)}
.ib-top b{font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:800}
.ib-top span{font-size:12px;opacity:.8}
.ib-close{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:26px;line-height:1}
.ib-music{margin-left:auto;width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:50%;background:rgba(255,255,255,.14);font-size:17px;opacity:.55;cursor:pointer;transition:opacity .2s,background .2s}
.ib-music-on{opacity:1;background:rgba(255,255,255,.3);animation:ibPulse 2.4s ease-in-out infinite}
@keyframes ibPulse{50%{box-shadow:0 0 0 6px rgba(255,255,255,.12)}}
.ib-feed{height:100%;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none}
.ib-feed::-webkit-scrollbar{display:none}
.ib-item{position:relative;height:100dvh;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden;display:flex;align-items:flex-end;background:var(--ib-ink)}
.ib-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1)}
.ib-zoom{animation:ibZoom 9s ease-out forwards}
@keyframes ibZoom{to{transform:scale(1.1)}}
.ib-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.3) 0%,transparent 28%,rgba(0,0,0,.35) 52%,var(--ib-ink) 100%)}
.ib-react{position:absolute;z-index:4;left:14px;top:calc(72px + env(safe-area-inset-top,0px));display:flex;gap:4px;background:rgba(0,0,0,.38);backdrop-filter:blur(8px);padding:6px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.18)}
.ib-react button{display:inline-flex;align-items:center;gap:3px;background:none;border:0;color:#fff;cursor:pointer;padding:3px 6px;border-radius:999px;transition:transform .15s}
.ib-react button span{font-size:22px;line-height:1}
.ib-react button b{font-size:12px;font-weight:800}
.ib-react button:active{transform:scale(1.3)}
.ib-react button.is-on{background:rgba(255,255,255,.24)}
.ib-text{position:relative;z-index:3;padding:0 86px calc(62px + env(safe-area-inset-bottom,0px)) 18px;max-width:760px}
.ib-sec{display:inline-block;background:var(--ib-acc);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:4px 9px;border-radius:6px}
.ib-text h2{font-family:Georgia,'Times New Roman',serif;font-weight:800;font-size:clamp(25px,6.6vw,44px);line-height:1.1;margin:10px 0 8px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.ib-text p{font-size:15.5px;line-height:1.5;opacity:.92;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ib-text em{font-style:normal;font-size:12px;opacity:.7}
.ib-btns{position:absolute;z-index:4;right:10px;bottom:calc(40px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px}
.ib-btns a,.ib-btns button{display:flex;flex-direction:column;align-items:center;gap:4px;color:#fff;background:none;border:0;cursor:pointer;font-size:11px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.7)}
.ib-btns i{width:46px;height:46px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);font-style:normal;font-size:19px;font-weight:800}
.ib-btns .ib-read{background:var(--ib-acc)}
.ib-end{flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px;background:linear-gradient(180deg,var(--ib-ink),#000)}
.ib-end h2{font-family:Georgia,serif;font-size:32px;margin:0 0 8px}
.ib-end p{opacity:.85;max-width:420px}
.ib-cta{margin-top:18px;background:var(--ib-acc);color:#fff;padding:13px 24px;font-weight:800;border:0;border-radius:12px;font-size:15px;cursor:pointer}
.ib-cta2{background:#fff;color:var(--ib-ink)}
.ib-done{margin-top:14px;font-weight:700}
.ib-ask{position:fixed;z-index:8;left:50%;transform:translateX(-50%);bottom:max(18px,env(safe-area-inset-bottom,0px));width:min(calc(100vw - 28px),420px);background:#fff;color:var(--ib-ink);border-radius:18px;padding:16px 18px;box-shadow:0 18px 50px rgba(0,0,0,.45);animation:ibUp .35s ease-out}
@keyframes ibUp{from{opacity:0;transform:translate(-50%,20px)}}
.ib-ask b{font-size:18px;display:block}
.ib-ask p{margin:6px 0 12px;font-size:14px;line-height:1.45;color:#3c4a6b}
.ib-ask div{display:flex;gap:10px}
.ib-ask button{flex:1;border:0;border-radius:12px;padding:11px 12px;font-weight:800;background:var(--ib-acc);color:#fff;cursor:pointer}
.ib-ask .ib-ask-no{background:#eef1f7;color:var(--ib-ink)}
.ib-hint{position:absolute;z-index:6;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;white-space:nowrap;cursor:pointer;animation:ibHint 1.6s ease-in-out infinite}
@keyframes ibHint{50%{transform:translate(-50%,-6px)}}
.ib-bg{display:none}
@media (min-width:768px){
.ib-bg{display:block;position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(38px) brightness(.45) saturate(1.2);transform:scale(1.1);transition:background-image .5s ease}
.ib-feed{position:relative;z-index:1;width:min(100vw,calc(100dvh * 9 / 16));margin:0 auto;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 30px 80px rgba(0,0,0,.6)}
.ib-top{left:50%;right:auto;width:min(100vw,calc(100dvh * 9 / 16));transform:translateX(-50%);z-index:6}
.ib-text h2{font-size:clamp(24px,3.2vh,34px)}
}
@media (prefers-reduced-motion:reduce){.ib-zoom,.ib-hint,.ib-music-on,.ib-ask{animation:none}}
` }} />
    </div>
  );
}
