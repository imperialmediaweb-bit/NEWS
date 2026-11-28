"use client";
import { useState } from "react";

/** Owner dashboard: "Your news in the paper in 10 minutes". */
export default function BriefBox({ token, businessId, siteName, included, acc }: { token: string; businessId: number; siteName: string; included: boolean; acc: string }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const call = (payload: object) => fetch("/api/directory/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, businessId, ...payload }) }).then(async (r) => ({ ok: r.ok, j: await r.json() })).catch(() => ({ ok: false, j: { error: "Network error. Try again." } }));

  async function write() {
    setBusy(true); setMsg(null);
    const r = await call({ action: "draft", text });
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: r.j.error }); return; }
    setDraft({ title: r.j.title, body: r.j.body });
  }
  async function publish() {
    if (!draft) return;
    setBusy(true); setMsg(null);
    const r = await call({ action: "publish", ...draft });
    if (r.ok && r.j.url) { location.href = r.j.url; return; }
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: r.j.error }); return; }
    setMsg({ ok: true, text: r.j.note || "Scheduled. It goes live within the hour." }); setDraft(null); setText("");
  }

  return (
    <div className="mt-3 bg-white p-5 shadow-sm">
      <p className="text-[18px] font-black">📰 Your news in {siteName}, in 10 minutes</p>
      <p className="mt-1 text-[14.5px] text-gray-600">New location, new service, hiring, an event, an anniversary? Write it in a sentence or two. We turn it into a news brief and publish it within the hour, labelled as sponsored. {included ? <b>One a month is included with your website.</b> : <b>$19, or one a month included with your website.</b>}</p>
      {!draft ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} rows={3} placeholder="e.g. We opened our second shop at 410 Main St in Round Rock, open Monday to Saturday." className="mt-3 w-full border border-gray-400 p-2.5 text-[15px]" />
          <button onClick={write} disabled={busy || text.trim().length < 15} className="mt-2 rounded-full px-5 py-2.5 text-[14px] font-black text-white disabled:opacity-50" style={{ background: acc }}>{busy ? "Writing…" : "Write my news brief"}</button>
        </>
      ) : (
        <div className="mt-3">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full border border-gray-400 p-2.5 text-[16px] font-bold" />
          <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={9} className="mt-2 w-full border border-gray-400 p-2.5 text-[15px]" />
          <p className="text-[12.5px] text-gray-500">Check every detail: change anything that isn&apos;t exactly right.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={publish} disabled={busy} className="rounded-full px-5 py-2.5 text-[14px] font-black text-white disabled:opacity-50" style={{ background: acc }}>{busy ? "One moment…" : included ? "Publish it (included)" : "Publish it for $19"}</button>
            <button onClick={() => setDraft(null)} disabled={busy} className="rounded-full border-2 border-gray-900 px-5 py-2.5 text-[14px] font-black">Start again</button>
          </div>
        </div>
      )}
      {msg && <p className={`mt-3 p-2.5 text-[14px] font-semibold ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.text}</p>}
    </div>
  );
}
