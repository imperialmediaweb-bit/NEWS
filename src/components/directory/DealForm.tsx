"use client";

import { useState } from "react";

export default function DealForm({ slug, price, siteName, accent }: { slug: string; price: string; siteName: string; accent: string }) {
  const [f, setF] = useState<Record<string, string>>({ days: "14" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const r = await fetch("/api/directory/deal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, slug }) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    if (r?.ok && r.j.url) { window.location.href = r.j.url; return; }
    setErr(r?.j?.error || "Something went wrong. Nothing was charged."); setBusy(false);
  }
  const input = "mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-[16px] focus:border-gray-900 focus:outline-none";
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 bg-white p-6 shadow-sm md:grid-cols-2">
      <label className="text-[14px] font-bold md:col-span-2">The deal, in a few words<input value={f.title || ""} onChange={set("title")} maxLength={90} required className={input} placeholder="20% off any oil change" /></label>
      <label className="text-[14px] font-bold md:col-span-2">Details <span className="font-normal text-gray-500">(conditions, how to redeem)</span><textarea value={f.details || ""} onChange={set("details")} maxLength={400} rows={3} className={input} placeholder="Show this page at the counter. Not valid with other offers." /></label>
      <label className="text-[14px] font-bold">Coupon code <span className="font-normal text-gray-500">(optional)</span><input value={f.code || ""} onChange={set("code")} maxLength={30} className={input} placeholder="SAVE20" /></label>
      <label className="text-[14px] font-bold">Runs for
        <select value={f.days} onChange={set("days")} className={input}>{[7, 14, 21, 30].map((d) => <option key={d} value={d}>{d} days</option>)}</select>
      </label>
      <label className="text-[14px] font-bold">Your name<input value={f.name || ""} onChange={set("name")} required maxLength={120} className={input} /></label>
      <label className="text-[14px] font-bold">Email<input type="email" value={f.email || ""} onChange={set("email")} required maxLength={200} className={input} /></label>
      <input value={f.website || ""} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {/* live preview */}
      <div className="md:col-span-2 rounded-xl border-2 border-dashed p-4" style={{ borderColor: accent }}>
        <p className="text-[11px] font-black uppercase tracking-[.18em]" style={{ color: accent }}>🏷 Deal · preview</p>
        <p className="mt-1 text-[20px] font-black">{f.title || "Your deal"}</p>
        {f.details && <p className="mt-1 text-[14.5px] text-gray-700">{f.details}</p>}
        {f.code && <p className="mt-2 inline-block rounded border-2 border-dashed px-3 py-1 font-mono text-[15px] font-bold" style={{ borderColor: accent }}>{f.code}</p>}
      </div>
      <label className="flex items-start gap-2 text-[13.5px] text-gray-700 md:col-span-2"><input type="checkbox" checked={f.consent === "on"} onChange={(e) => setF((x) => ({ ...x, consent: e.target.checked ? "on" : "" }))} required className="mt-1" /><span>The offer is real and I will honor it. {siteName} may remove deals that are misleading (with a refund).</span></label>
      {err && <p className="bg-red-50 p-3 text-[14px] font-semibold text-red-800 md:col-span-2">{err}</p>}
      <button disabled={busy} className="px-6 py-4 text-[16px] font-black uppercase tracking-wider text-white disabled:opacity-60 md:col-span-2" style={{ background: accent }}>{busy ? "Opening secure checkout…" : `Post my deal · ${price}`}</button>
    </form>
  );
}
