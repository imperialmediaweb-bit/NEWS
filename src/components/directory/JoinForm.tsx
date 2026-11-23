"use client";

import { useState } from "react";
import { DIR_CATEGORIES } from "@/lib/directory-categories";

type Fields = Record<string, string>;
type Match = { name: string; city: string; address: string | null; phone: string | null; slug: string; claimed: boolean };
const KEYS = ["name", "category", "city", "address", "zip", "phone", "website", "hours", "description", "facebook", "instagram"];

/**
 * Add or claim a business, with AI help:
 *  1. "Find my business": search the directory (to claim) and read the
 *     business's website to fill the fields.
 *  2. "Write it for me": turn a few notes into the listing text and, for
 *     Spotlight, the profile article. The owner checks everything.
 *  3. Choose Free, Spotlight ($49) or Spotlight + Homepage ($149), then pay.
 */
export default function JoinForm({ siteName, state, cities, initial, prices }: { siteName: string; state: string; cities: string[]; initial: (Fields & { slug: string }) | null; prices: { spotlight: string; home: string } }) {
  const [f, setF] = useState<Fields>(() => Object.fromEntries(KEYS.map((k) => [k, initial?.[k] || ""])));
  const [claimSlug, setClaimSlug] = useState<string | null>(initial?.slug || null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [finding, setFinding] = useState(false);
  const [writing, setWriting] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [article, setArticle] = useState("");
  const [tier, setTier] = useState<"free" | "spotlight" | "spotlight_home">("spotlight");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function find() {
    if (!f.name && !f.website) { setMsg({ ok: false, text: "Type the business name (and the website, if you have one)." }); return; }
    setFinding(true); setMsg(null);
    const r = await fetch("/api/directory/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "find", name: f.name, city: f.city, website: f.website }) }).then((x) => x.json()).catch(() => null);
    setFinding(false);
    if (!r) { setMsg({ ok: false, text: "Search is busy. Fill the fields yourself or try again." }); return; }
    setMatches(r.matches || []);
    if (r.fields) {
      setF((x) => { const n = { ...x }; for (const k of KEYS) if (r.fields[k] && !x[k]) n[k] = String(r.fields[k]); if (r.fields.category && DIR_CATEGORIES.some((c) => c.slug === r.fields.category)) n.category = n.category || r.fields.category; return n; });
      setMsg({ ok: true, text: "We filled in what we found on your website. Please check every field." });
    } else if (f.website) setMsg({ ok: false, text: "We couldn't read that website. Please fill in the fields yourself." });
  }
  async function write() {
    setWriting(true); setMsg(null);
    const r = await fetch("/api/directory/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "write", ...f, category: DIR_CATEGORIES.find((c) => c.slug === f.category)?.name || "", notes }) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    setWriting(false);
    if (!r?.ok) { setMsg({ ok: false, text: r?.j?.error || "The writing assistant is busy. Try again in a minute." }); return; }
    setF((x) => ({ ...x, description: r.j.description || x.description }));
    setTitle(r.j.title || ""); setArticle(r.j.article || "");
    setMsg({ ok: true, text: "Done. Read it and change anything that isn't exactly right." });
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const data = new FormData(e.currentTarget);
    for (const k of KEYS) data.set(k, f[k] || "");
    data.set("mode", claimSlug ? "claim" : "new");
    if (claimSlug) data.set("business_slug", claimSlug);
    data.set("tier", tier); data.set("article_title", title); data.set("article", article);
    const r = await fetch("/api/directory/submit", { method: "POST", body: data }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    if (r?.ok && r.j.url) { window.location.href = r.j.url; return; }
    setBusy(false);
    if (r?.ok && r.j.review) { setMsg({ ok: true, text: `Thank you! ${siteName} will check your listing within one business day and email you when it's live.` }); return; }
    setMsg({ ok: false, text: r?.j?.error || "Something went wrong. Nothing was charged." });
  }

  const field = "mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-[16px] focus:border-gray-900 focus:outline-none";
  const L = ({ k, label, hint, type = "text", list }: { k: string; label: string; hint?: string; type?: string; list?: string }) => (
    <label className="text-[14px] font-bold">{label}{hint && <span className="font-normal text-gray-500"> ({hint})</span>}<input value={f[k]} onChange={set(k)} type={type} list={list} className={field} /></label>
  );
  const plans = [
    { id: "free" as const, name: "Free listing", price: "$0", points: ["Name, category, town, phone, website", "Reader reviews", "Checked by our staff"] },
    { id: "spotlight" as const, name: "Business Spotlight", price: prices.spotlight, points: ["Top of your town's list for 12 months", "Profile article about your business in the paper", "Photo, website link, ★ Featured badge", "Badge for your own website"], best: true },
    { id: "spotlight_home" as const, name: "Spotlight + Homepage", price: prices.home, points: ["Everything in Spotlight", `7 days on the ${siteName} homepage`] },
  ];

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <section className="bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-[20px] font-black">1. Find your business</h2>
        <p className="mt-1 text-[14.5px] text-gray-600">Type the name and town, and your website if you have one. We&apos;ll look for your listing and fill in the details for you.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {L({ k: "name", label: "Business name" })}
          {L({ k: "city", label: "City or town", list: "join-cities" })}
          {L({ k: "website", label: "Website", hint: "optional" })}
        </div>
        <datalist id="join-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
        <button type="button" onClick={find} disabled={finding} className="mt-4 bg-gray-900 px-5 py-2.5 text-[15px] font-black text-white disabled:opacity-60">{finding ? "Searching…" : "🔎 Find my business"}</button>
        {matches && matches.length > 0 && !claimSlug && (
          <div className="mt-4 border-t pt-3">
            <p className="text-[14px] font-bold">Is one of these yours?</p>
            <ul className="mt-2 space-y-2">
              {matches.map((m) => (
                <li key={m.slug} className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 text-[14.5px]">
                  <span><b>{m.name}</b> · {m.city}{m.address ? ` · ${m.address}` : ""}{m.phone ? ` · ${m.phone}` : ""}</span>
                  <button type="button" onClick={() => { setClaimSlug(m.slug); setF((x) => ({ ...x, name: m.name, city: m.city, address: x.address || m.address || "", phone: x.phone || m.phone || "" })); }} className="border border-gray-900 px-3 py-1 text-[13px] font-bold">This is mine</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {claimSlug && <p className="mt-3 bg-blue-50 p-3 text-[14px] font-semibold text-blue-900">You&apos;re claiming an existing listing. <button type="button" className="underline" onClick={() => setClaimSlug(null)}>Not mine, add a new one</button></p>}
      </section>

      <section className="bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-[20px] font-black">2. Your details</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-[14px] font-bold">Category<select value={f.category} onChange={set("category")} required className={field}><option value="">Choose…</option>{DIR_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.group} · {c.name}</option>)}</select></label>
          {L({ k: "phone", label: "Phone", type: "tel" })}
          {L({ k: "address", label: "Street address", hint: "optional" })}
          {L({ k: "zip", label: "ZIP code", hint: "optional" })}
          {L({ k: "hours", label: "Opening hours", hint: "e.g. Mon-Fri 8am-5pm" })}
          {L({ k: "facebook", label: "Facebook page", hint: "optional" })}
          {L({ k: "instagram", label: "Instagram", hint: "optional" })}
        </div>
        <div className="mt-5 border-t pt-4">
          <label className="block text-[14px] font-bold">Tell us about the business in your own words <span className="font-normal text-gray-500">(services, how long you&apos;ve been open, what customers like, area you serve)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} className={field} placeholder="Family-owned plumbing company since 2009, 24/7 emergency service, water heaters and drain cleaning, serving Billings and Laurel." />
          </label>
          <button type="button" onClick={write} disabled={writing} className="mt-3 px-5 py-2.5 text-[15px] font-black text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}>{writing ? "Writing…" : "✨ Write it for me"}</button>
          <span className="ml-3 text-[13px] text-gray-500">Uses only what you wrote and your website. You can edit everything.</span>
        </div>
        <label className="mt-4 block text-[14px] font-bold">Listing description<textarea value={f.description} onChange={set("description")} rows={3} maxLength={900} className={field} /></label>
      </section>

      <section className="bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-[20px] font-black">3. Choose your plan</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {plans.map((p) => (
            <button type="button" key={p.id} onClick={() => setTier(p.id)} aria-pressed={tier === p.id} className={`relative border-2 p-4 text-left transition ${tier === p.id ? "border-gray-900 bg-gray-50 shadow-md" : "border-gray-200 hover:border-gray-400"}`}>
              {p.best && <span className="absolute -top-3 left-3 bg-amber-400 px-2 py-0.5 text-[11px] font-black uppercase">Most popular</span>}
              <b className="block text-[16px]">{p.name}</b>
              <span className="mt-1 block text-[28px] font-black">{p.price}<span className="text-[13px] font-bold text-gray-500">{p.id === "free" ? "" : " once"}</span></span>
              <ul className="mt-2 space-y-1 text-[13.5px] text-gray-700">{p.points.map((x) => <li key={x}>✓ {x}</li>)}</ul>
            </button>
          ))}
        </div>
        {tier !== "free" && (
          <div className="mt-5 border-t pt-4">
            <p className="text-[14px] font-bold">Your Spotlight article <span className="font-normal text-gray-500">(published on {siteName}, labelled as sponsored. Use “Write it for me” above or write your own.)</span></p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Headline" className={field} />
            <textarea value={article} onChange={(e) => setArticle(e.target.value)} rows={8} maxLength={6000} placeholder="A few paragraphs about your business." className={field} />
          </div>
        )}
      </section>

      <section className="bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-[20px] font-black">4. About you</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-[14px] font-bold">Your name<input name="owner_name" required maxLength={120} className={field} /></label>
          <label className="text-[14px] font-bold">Your email<input name="owner_email" type="email" required maxLength={200} className={field} /></label>
          <label className="text-[14px] font-bold">Logo or photo <span className="font-normal text-gray-500">(optional)</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[14px]" /></label>
        </div>
        <input name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="mt-4 flex items-start gap-2 text-[14px]">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>I own or manage this business, the details are true, and I understand {tier === "free" ? "the listing is checked before it goes live" : `Spotlight is a one-time payment of ${tier === "spotlight" ? prices.spotlight : prices.home}, the article is labelled as sponsored and goes live within 24 hours unless ${siteName} declines it (full refund)`}. I agree to the <a href="/directory/terms" target="_blank" className="underline">directory terms</a>.</span>
        </label>
        {msg && <p className={`mt-4 p-3 text-[14.5px] font-semibold ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.text}</p>}
        <button disabled={busy} className="mt-4 w-full bg-gray-900 px-6 py-4 text-[17px] font-black uppercase tracking-wider text-white disabled:opacity-60">
          {busy ? "One moment…" : tier === "free" ? `Submit free listing` : `Continue to secure payment · ${tier === "spotlight" ? prices.spotlight : prices.home}`}
        </button>
        <p className="mt-2 text-center text-[13px] text-gray-500">Card payment by Stripe. We don&apos;t list adult services, cannabis or vape shops, weapons or gambling. {state} businesses only.</p>
      </section>
    </form>
  );
}
