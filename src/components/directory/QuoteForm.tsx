"use client";
import { useState } from "react";

/** "Get free quotes" box on directory pages: the job goes to up to 3 local businesses. */
export default function QuoteForm({ category, categoryName, one, city, citySlug, siteName, acc = "#b91c1c" }: { category: string; categoryName: string; one: string; city: string; citySlug: string; siteName: string; acc?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ sent: number; call: { name: string; phone: string | null; slug: string }[] } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const f = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(f.entries()), consent: f.get("consent") === "on", category, city, city_slug: citySlug };
    setBusy(true);
    const r = await fetch("/api/directory/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    setBusy(false);
    if (!r?.ok) { setErr(r?.j?.error || "Something went wrong. Please try again."); return; }
    setDone({ sent: r.j.sent || 0, call: r.j.call || [] });
  }

  if (done) return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)] ring-1 ring-black/5 md:p-7">
      <p className="text-[19px] font-black">Request sent ✓</p>
      <p className="mt-1 text-[15px] text-gray-700">{done.sent ? `It went to ${done.sent} local ${done.sent === 1 ? one : categoryName.toLowerCase()}; they'll contact you directly. We emailed you a copy.` : "We emailed you a copy and will pass it on to local businesses."}</p>
      {done.call.length > 0 && (
        <div className="mt-3"><p className="text-[14px] font-bold">Prefer to call now?</p>
          <ul className="mt-1 text-[15px]">{done.call.map((c) => <li key={c.slug}><a href={`/directory/listing/${c.slug}`} className="underline">{c.name}</a>{c.phone ? <> · <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="font-bold">{c.phone}</a></> : null}</li>)}</ul>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,.35)] ring-1 ring-black/5 md:p-7">
      <p className="font-serif text-[24px] font-black">Get free quotes from {categoryName.toLowerCase()} in {city}</p>
      <p className="mt-1 text-[14.5px] text-gray-600">Describe the job once. Up to 3 local {categoryName.toLowerCase()} get it and contact you. Free, no obligation.</p>
      <textarea name="details" required minLength={15} maxLength={2000} rows={3} placeholder={`What do you need? e.g. when, where, how big the job is`} className="mt-3 w-full rounded-2xl border border-gray-300 p-3 text-[15px] outline-none focus:border-gray-900" />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input name="name" required maxLength={120} placeholder="Your name" className="rounded-2xl border border-gray-300 p-3 text-[15px] outline-none focus:border-gray-900" />
        <input name="email" type="email" required maxLength={200} placeholder="Email" className="rounded-2xl border border-gray-300 p-3 text-[15px] outline-none focus:border-gray-900" />
        <input name="phone" maxLength={40} placeholder="Phone (optional)" className="rounded-2xl border border-gray-300 p-3 text-[15px] outline-none focus:border-gray-900" />
        <input name="zip" maxLength={12} placeholder="ZIP code (optional)" className="rounded-2xl border border-gray-300 p-3 text-[15px] outline-none focus:border-gray-900" />
      </div>
      <input name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="mt-3 flex items-start gap-2 text-[13px] text-gray-600"><input type="checkbox" name="consent" required className="mt-1" /><span>I agree that {siteName} shares my request and contact details with up to 3 local {categoryName.toLowerCase()} so they can reply to me.</span></label>
      {err && <p className="mt-2 bg-red-50 p-2 text-[14px] font-semibold text-red-800">{err}</p>}
      <button disabled={busy} className="mt-3 rounded-full px-7 py-3 text-[15px] font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60" style={{ background: acc }}>{busy ? "Sending…" : "Get my free quotes"}</button>
    </form>
  );
}
