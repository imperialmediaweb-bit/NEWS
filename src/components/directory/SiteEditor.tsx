"use client";

import { useState } from "react";

type Service = { name: string; price?: string; desc?: string };
type Faq = { q: string; a: string };
type SiteData = { slug: string; status: string; theme: string; accent: string | null; tagline: string | null; about: string | null; services: Service[]; faqs: Faq[]; gallery: string[]; hero_url: string | null; cta_label: string | null; contact_email: string | null; logo_url?: string | null; booking_url?: string | null; video_url?: string | null; announcement?: string | null; hidden?: string[] } | null;

/** Business Website editor in the owner dashboard: build a preview with AI, edit everything, publish ($29/month or $249/year). */
export default function SiteEditor({ token, businessId, initial, acc, live }: { token: string; businessId: number; initial: SiteData; acc: string; live: boolean }) {
  const [s, setS] = useState<SiteData>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ask, setAsk] = useState("");
  const api = (body: Record<string, unknown>) => fetch("/api/directory/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, businessId, ...body }) }).then(async (r) => ({ ok: r.ok, j: await r.json() })).catch(() => ({ ok: false, j: { error: "Network error" } }));

  if (!s) {
    return (
      <div className="rounded-2xl p-[2px]" style={{ background: `linear-gradient(120deg, ${acc}, #7c3aed, #0ea5e9)` }}>
        <div className="rounded-[14px] bg-white p-6">
          <h3 className="text-[22px] font-black">✨ Your own website, built in 30 seconds</h3>
          <p className="mt-2 text-[15.5px] text-gray-700">A beautiful one-page website for your business: your photos, services and prices, hours, reviews, a contact form that emails you, and an AI assistant that answers customers 24/7. We build a free preview from your listing and your current website. You only pay if you publish it.</p>
          <button onClick={async () => { setBusy("preview"); const r = await api({ action: "preview" }); setBusy(null); if (r.ok) location.reload(); else setMsg({ ok: false, text: r.j.error }); }} disabled={!!busy} className="mt-4 rounded-full px-6 py-3 text-[15px] font-black text-white disabled:opacity-60" style={{ background: acc }}>{busy ? "Building your preview…" : "Build my free preview"}</button>
          {msg && <p className="mt-3 text-[14px] font-semibold text-red-700">{msg.text}</p>}
        </div>
      </div>
    );
  }
  const set = (k: keyof NonNullable<SiteData>, v: unknown) => setS((x) => (x ? { ...x, [k]: v } : x));
  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-[15px] focus:border-gray-900 focus:outline-none";
  async function upload(file: File, where: "hero" | "gallery" | "logo") {
    setBusy("upload");
    const fd = new FormData(); fd.set("token", token); fd.set("businessId", String(businessId)); fd.set("file", file);
    const r = await fetch("/api/directory/site/upload", { method: "POST", body: fd }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    setBusy(null);
    if (!r?.ok) { setMsg({ ok: false, text: r?.j?.error || "Upload failed." }); return; }
    if (where === "hero") set("hero_url", r.j.url); else if (where === "logo") set("logo_url", r.j.url); else set("gallery", [...(s?.gallery || []), r.j.url].slice(0, 12));
  }
  async function aiEdit() {
    if (!s || ask.trim().length < 3) return;
    setBusy("ai"); setMsg(null);
    const r = await api({ action: "ai_edit", instruction: ask, fields: s });
    setBusy(null);
    if (!r.ok) { setMsg({ ok: false, text: r.j.error }); return; }
    setS(r.j.fields); setAsk("");
    setMsg({ ok: true, text: `✨ ${r.j.note} Check it, then press Save.` });
  }
  async function save() {
    setBusy("save"); setMsg(null);
    const r = await api({ action: "save", fields: s });
    setBusy(null); setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.j.error });
    return r.ok;
  }
  async function publish(plan: "month" | "year", level: "standard" | "premium" = "standard") {
    if (!(await save())) return;
    setBusy("pay");
    const r = await api({ action: "subscribe", plan, level });
    if (r.ok && r.j.url) { location.href = r.j.url; return; }
    setBusy(null); setMsg({ ok: false, text: r.j.error || "Something went wrong." });
  }
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[20px] font-black">Your website {live ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] text-emerald-800">LIVE</span> : <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[12px] text-amber-800">PREVIEW</span>}</h3>
        <a href={`/b/${s.slug}?t=${token}`} target="_blank" rel="noopener" className="rounded-full border-2 px-4 py-1.5 text-[14px] font-black" style={{ borderColor: acc, color: acc }}>👁 Open my page ›</a>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-[13.5px] font-bold md:col-span-2">Headline<input value={s.tagline || ""} onChange={(e) => set("tagline", e.target.value)} maxLength={120} className={input} /></label>
        <label className="text-[13.5px] font-bold md:col-span-2">About<textarea value={s.about || ""} onChange={(e) => set("about", e.target.value)} rows={5} maxLength={3000} className={input} /></label>
        <label className="text-[13.5px] font-bold">Button text<input value={s.cta_label || ""} onChange={(e) => set("cta_label", e.target.value)} maxLength={40} className={input} placeholder="Call for a free quote" /></label>
        <label className="text-[13.5px] font-bold">Email for customer messages<input type="email" value={s.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} className={input} /></label>
        <div className="text-[13.5px] font-bold">Style
          <div className="mt-1 flex gap-2">{["classic", "bold", "minimal"].map((t) => <button key={t} type="button" onClick={() => set("theme", t)} className={`flex-1 rounded-lg border-2 px-2 py-2 text-[13px] capitalize ${s.theme === t ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>{t}</button>)}</div>
        </div>
        <label className="text-[13.5px] font-bold">Brand colour<div className="mt-1 flex items-center gap-2"><input type="color" value={s.accent || acc} onChange={(e) => set("accent", e.target.value)} className="h-10 w-14 cursor-pointer rounded border" /><span className="font-mono text-[13px] text-gray-500">{s.accent || acc}</span></div></label>
      </div>

      <h4 className="mt-6 text-[16px] font-black">Services &amp; prices</h4>
      {s.services.map((x, i) => (
        <div key={i} className="mt-2 grid gap-2 md:grid-cols-[1fr_120px_1.5fr_auto]">
          <input value={x.name} onChange={(e) => set("services", s.services.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} placeholder="Service" className={input} />
          <input value={x.price || ""} onChange={(e) => set("services", s.services.map((y, j) => (j === i ? { ...y, price: e.target.value } : y)))} placeholder="Price" className={input} />
          <input value={x.desc || ""} onChange={(e) => set("services", s.services.map((y, j) => (j === i ? { ...y, desc: e.target.value } : y)))} placeholder="Short description" className={input} />
          <button type="button" onClick={() => set("services", s.services.filter((_, j) => j !== i))} className="px-2 text-[20px] text-gray-400 hover:text-red-600" aria-label="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => set("services", [...s.services, { name: "", price: "", desc: "" }])} className="mt-2 text-[14px] font-bold" style={{ color: acc }}>+ Add a service</button>

      <h4 className="mt-6 text-[16px] font-black">Questions customers ask</h4>
      {s.faqs.map((x, i) => (
        <div key={i} className="mt-2 grid gap-2 md:grid-cols-[1fr_1.5fr_auto]">
          <input value={x.q} onChange={(e) => set("faqs", s.faqs.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)))} placeholder="Question" className={input} />
          <input value={x.a} onChange={(e) => set("faqs", s.faqs.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)))} placeholder="Answer" className={input} />
          <button type="button" onClick={() => set("faqs", s.faqs.filter((_, j) => j !== i))} className="px-2 text-[20px] text-gray-400 hover:text-red-600" aria-label="Remove">×</button>
        </div>
      ))}
      <button type="button" onClick={() => set("faqs", [...s.faqs, { q: "", a: "" }])} className="mt-2 text-[14px] font-bold" style={{ color: acc }}>+ Add a question</button>
      <p className="mt-1 text-[12.5px] text-gray-500">Your AI assistant answers customers from these, your services and your listing.</p>

      <div className="mt-5 rounded-xl p-4" style={{ background: `${acc}12` }}>
        <p className="text-[15px] font-black">✨ Tell the AI how you want your site</p>
        <p className="text-[12.5px] text-gray-600">e.g. &ldquo;make it dark and modern&rdquo;, &ldquo;add a 10% off banner for new customers&rdquo;, &ldquo;add emergency repairs at $120 to services&rdquo;, &ldquo;hide the reviews&rdquo;.</p>
        <div className="mt-2 flex gap-2">
          <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && aiEdit()} maxLength={800} placeholder="What should change?" className={input + " mt-0"} />
          <button onClick={aiEdit} disabled={!!busy} className="shrink-0 rounded-lg px-4 text-[14px] font-black text-white disabled:opacity-60" style={{ background: acc }}>{busy === "ai" ? "Working…" : "Do it"}</button>
        </div>
      </div>

      <h4 className="mt-6 text-[16px] font-black">Extras</h4>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <label className="text-[13.5px] font-bold md:col-span-2">Top banner (optional)<input value={s.announcement || ""} onChange={(e) => set("announcement", e.target.value)} maxLength={140} className={input} placeholder="10% off for first-time customers this month" /></label>
        <label className="text-[13.5px] font-bold">Online booking link<input value={s.booking_url || ""} onChange={(e) => set("booking_url", e.target.value)} className={input} placeholder="https://calendly.com/…" /></label>
        <label className="text-[13.5px] font-bold">Video (YouTube or Vimeo)<input value={s.video_url || ""} onChange={(e) => set("video_url", e.target.value)} className={input} placeholder="https://youtube.com/watch?v=…" /></label>
      </div>
      <p className="mt-3 text-[13.5px] font-bold">Sections shown</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {["services", "about", "gallery", "video", "assistant", "reviews", "faqs", "contact"].map((k) => {
          const off = (s.hidden || []).includes(k);
          return <button key={k} type="button" onClick={() => set("hidden", off ? (s.hidden || []).filter((x) => x !== k) : [...(s.hidden || []), k])} className={`rounded-full border px-3 py-1 text-[13px] font-bold capitalize ${off ? "border-gray-200 text-gray-400 line-through" : "border-gray-900"}`}>{k === "faqs" ? "Questions" : k === "assistant" ? "AI assistant" : k}</button>;
        })}
      </div>

      <h4 className="mt-6 text-[16px] font-black">Logo &amp; photos</h4>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-[14px] font-bold hover:border-gray-500">🏷 Logo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} /></label>
        {s.logo_url && (<span className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.logo_url} alt="" className="h-12 max-w-[120px] rounded object-contain" />
          <button type="button" onClick={() => set("logo_url", null)} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black text-[12px] text-white" aria-label="Remove">×</button>
        </span>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-[14px] font-bold hover:border-gray-500">🖼 Main photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "hero")} /></label>
        {s.hero_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.hero_url} alt="" className="h-16 w-24 rounded object-cover" />
        )}
        <label className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-[14px] font-bold hover:border-gray-500">➕ Gallery photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "gallery")} /></label>
        {s.gallery.map((u, i) => (
          <span key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-16 w-16 rounded object-cover" />
            <button type="button" onClick={() => set("gallery", s.gallery.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black text-[12px] text-white" aria-label="Remove">×</button>
          </span>
        ))}
        {busy === "upload" && <span className="text-[13px] text-gray-500">Uploading…</span>}
      </div>

      {msg && <p className={`mt-4 rounded p-3 text-[14px] font-semibold ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.text}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={save} disabled={!!busy} className="rounded-full border-2 border-gray-900 px-5 py-2.5 text-[14px] font-black disabled:opacity-60">{busy === "save" ? "Saving…" : "Save"}</button>
      </div>
      {!live && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-gray-900 p-4">
            <p className="text-[16px] font-black">Standard</p>
            <p className="text-[13px] text-gray-600">Your website live, your listing with logo and photos.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => publish("year")} disabled={!!busy} className="rounded-full bg-gray-900 px-4 py-2.5 text-[14px] font-black text-white disabled:opacity-60">$249/year · 3 months free</button>
              <button onClick={() => publish("month")} disabled={!!busy} className="rounded-full px-4 py-2.5 text-[14px] font-black text-white disabled:opacity-60" style={{ background: acc }}>$9 first month, then $29/month</button>
            </div>
          </div>
          <div className="rounded-xl border-2 p-4" style={{ borderColor: acc }}>
            <p className="text-[16px] font-black">Premium</p>
            <p className="text-[13px] text-gray-600">Everything in Standard, plus your business first in its city list while you&apos;re subscribed.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => publish("year", "premium")} disabled={!!busy} className="rounded-full bg-gray-900 px-4 py-2.5 text-[14px] font-black text-white disabled:opacity-60">$549/year · 3 months free</button>
              <button onClick={() => publish("month", "premium")} disabled={!!busy} className="rounded-full px-4 py-2.5 text-[14px] font-black text-white disabled:opacity-60" style={{ background: acc }}>$9 first month, then $59/month</button>
            </div>
          </div>
        </div>
      )}
      {!live && <p className="mt-2 text-[12.5px] text-gray-500">Cancel any time. Your page stays a private preview until you publish.</p>}
    </div>
  );
}
