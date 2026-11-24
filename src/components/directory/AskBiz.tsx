"use client";

import { useState } from "react";

/** "Ask AI about this business": a small chat answered only from the listing and its reviews. */
export default function AskBiz({ slug, name, acc, hasHours, hasReviews }: { slug: string; name: string; acc: string; hasHours: boolean; hasReviews: boolean }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<Array<{ q: string; a: string }>>([]);
  const [busy, setBusy] = useState(false);
  const chips = [hasHours ? "Are they open on Sunday?" : "What are their hours?", "Where are they located?", "How can I contact them?", hasReviews ? "What do readers say?" : "Do they have reviews?"];
  async function ask(question: string) {
    const text = question.trim(); if (!text || busy) return;
    setBusy(true); setQ("");
    const r = await fetch("/api/directory/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, q: text }) }).then((x) => x.json()).catch(() => null);
    setLog((l) => [...l, { q: text, a: r?.answer || r?.error || "Something went wrong. Please try again." }]);
    setBusy(false);
  }
  return (
    <section className="ask-biz relative mt-8 overflow-hidden rounded-2xl p-[2px]" style={{ background: `linear-gradient(120deg, ${acc}, #7c3aed, #0ea5e9)` }}>
      <div className="rounded-[14px] bg-white p-5">
        <h2 className="flex items-center gap-2 text-[20px] font-black"><span className="ask-spark" aria-hidden>✨</span> Ask AI about {name}</h2>
        <p className="mt-1 text-[13px] text-gray-500">Answers come only from this listing and verified reader reviews. Nothing is made up.</p>
        {log.length > 0 && (
          <div className="mt-4 space-y-3">
            {log.map((x, i) => (
              <div key={i} className="space-y-1.5">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-[14.5px] text-white" style={{ background: acc }}>{x.q}</p>
                <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-[14.5px] text-gray-800">{x.a}</p>
              </div>
            ))}
          </div>
        )}
        {busy && <p className="mt-3 flex gap-1 text-gray-400" aria-label="Thinking"><span className="ask-dot">●</span><span className="ask-dot [animation-delay:.15s]">●</span><span className="ask-dot [animation-delay:.3s]">●</span></p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => <button key={c} type="button" onClick={() => ask(c)} disabled={busy} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-semibold hover:border-gray-400 disabled:opacity-50">{c}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="mt-3 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder={`Ask anything about ${name}…`} className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-[15px] focus:border-gray-900 focus:outline-none" aria-label="Your question" />
          <button disabled={busy || q.trim().length < 3} className="rounded-full px-5 py-2.5 text-[14px] font-black text-white disabled:opacity-50" style={{ background: acc }}>Ask</button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.ask-spark{display:inline-block;animation:askSpin 3s ease-in-out infinite}@keyframes askSpin{50%{transform:rotate(18deg) scale(1.15)}}.ask-dot{animation:askDot 1s ease-in-out infinite}@keyframes askDot{50%{opacity:.2}}@media (prefers-reduced-motion:reduce){.ask-spark,.ask-dot{animation:none}}` }} />
    </section>
  );
}
