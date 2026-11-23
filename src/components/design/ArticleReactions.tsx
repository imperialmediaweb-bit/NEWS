"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const EMOJI = ["❤️", "😮", "😢", "😡", "👍"];

/**
 * "How do you feel about this story?" under the article text, in every design:
 * the same five emoji and real counts as Express Swipe (/api/reactions). It is
 * placed inside the article body element, which React does not reconcile.
 */
export default function ArticleReactions({ id }: { id: number }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    const body = document.querySelector<HTMLElement>(".pc-article, .lv-article");
    if (!body || !id) return;
    const el = document.createElement("div");
    el.className = "art-react-host";
    body.appendChild(el);
    setHost(el);
    fetch(`/api/reactions?ids=${id}`).then((r) => r.json()).then((j) => setCounts(j.reactions?.[id] || {})).catch(() => {});
    try { setMine(JSON.parse(localStorage.getItem("xs-reactions") || "{}")[id] || null); } catch { /* no storage */ }
    return () => { el.remove(); };
  }, [id]);

  async function react(e: string) {
    setMine(e);
    try { const all = JSON.parse(localStorage.getItem("xs-reactions") || "{}"); all[id] = e; localStorage.setItem("xs-reactions", JSON.stringify(all)); } catch { /* */ }
    try { const j = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, e }) }).then((r) => r.json()); if (j.reactions) setCounts(j.reactions); } catch { /* offline */ }
  }

  if (!host) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return createPortal(
    <section className="art-react not-prose" aria-label="Reactions">
      <p className="art-react-q">How do you feel about this story?</p>
      <div className="art-react-row">
        {EMOJI.map((e) => (
          <button key={e} type="button" onClick={() => react(e)} className={mine === e ? "is-on" : ""} aria-pressed={mine === e} aria-label={`React ${e}`}>
            <span>{e}</span>{counts[e] ? <b>{counts[e]}</b> : null}
          </button>
        ))}
      </div>
      {total > 0 && <p className="art-react-n">{total} {total === 1 ? "reader has" : "readers have"} reacted</p>}
    </section>,
    host
  );
}
