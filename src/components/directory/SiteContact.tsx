"use client";

import { useState } from "react";

export default function SiteContact({ slug, acc, enabled }: { slug: string; acc: string; enabled: boolean }) {
  const [f, setF] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (state === "sent") return <div className="rounded-2xl bg-emerald-50 p-6 text-[17px] font-bold text-emerald-800">Thanks! Your message was sent. They&apos;ll get back to you soon.</div>;
  const input = "mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] focus:border-gray-900 focus:outline-none";
  return (
    <form onSubmit={async (e) => {
      e.preventDefault(); if (!enabled) return; setState("busy"); setErr(null);
      const r = await fetch("/api/directory/site/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, slug }) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
      if (r?.ok) setState("sent"); else { setErr(r?.j?.error || "Something went wrong."); setState("idle"); }
    }} className="rounded-2xl bg-white p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,.5)] ring-1 ring-black/5">
      <label className="block text-[14px] font-bold">Name<input required value={f.name || ""} onChange={set("name")} className={input} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[14px] font-bold">Email<input type="email" value={f.email || ""} onChange={set("email")} className={input} /></label>
        <label className="block text-[14px] font-bold">Phone<input type="tel" value={f.phone || ""} onChange={set("phone")} className={input} /></label>
      </div>
      <label className="mt-3 block text-[14px] font-bold">How can we help?<textarea required rows={4} value={f.message || ""} onChange={set("message")} className={input} /></label>
      <input value={f.website || ""} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p className="mt-3 text-[14px] font-semibold text-red-700">{err}</p>}
      <button disabled={!enabled || state === "busy"} className="mt-4 w-full rounded-full px-6 py-3.5 text-[16px] font-black text-white disabled:opacity-50" style={{ background: acc }}>{enabled ? (state === "busy" ? "Sending…" : "Send message") : "Contact form (live after publishing)"}</button>
    </form>
  );
}
