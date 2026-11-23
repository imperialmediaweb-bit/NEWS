"use client";

import { useState } from "react";
import { LISTING_CATEGORIES } from "@/lib/listing-categories";

/** Sign-up for the local business directory: details, then Stripe Checkout (monthly). */
export default function ListingForm({ siteName, price, cities }: { siteName: string; price: string; cities: string[] }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const data = new FormData(e.currentTarget);
      data.set("product", "listing");
      const r = await fetch("/api/paid/checkout", { method: "POST", body: data });
      const j = await r.json();
      if (!r.ok || !j.url) { setErr(j.error || "Something went wrong. Nothing was charged."); setBusy(false); return; }
      window.location.href = j.url;
    } catch { setErr("Network error. Nothing was charged."); setBusy(false); }
  }
  const field = "mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-[16px] focus:border-gray-900 focus:outline-none";
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 bg-white p-6 shadow-sm md:grid-cols-2">
      <label className="md:col-span-2 text-[14px] font-bold">Business name<input name="business" required maxLength={160} className={field} /></label>
      <label className="text-[14px] font-bold">Category
        <select name="listing_category" required className={field} defaultValue="">
          <option value="" disabled>Choose…</option>
          {LISTING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label className="text-[14px] font-bold">City or town<input name="city" required maxLength={80} list="dir-cities" className={field} /><datalist id="dir-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist></label>
      <label className="md:col-span-2 text-[14px] font-bold">Short description <span className="font-normal text-gray-500">(what you do, hours, area served)</span><textarea name="body" required minLength={40} maxLength={600} rows={4} className={field} /></label>
      <label className="text-[14px] font-bold">Website <span className="font-normal text-gray-500">(optional)</span><input name="website" type="url" placeholder="https://" maxLength={300} className={field} /></label>
      <label className="text-[14px] font-bold">Phone <span className="font-normal text-gray-500">(optional)</span><input name="phone" type="tel" maxLength={40} className={field} /></label>
      <label className="text-[14px] font-bold">Logo or photo <span className="font-normal text-gray-500">(optional, JPG/PNG/WebP)</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[14px]" /></label>
      <div />
      <label className="text-[14px] font-bold">Your name<input name="name" required maxLength={120} className={field} /></label>
      <label className="text-[14px] font-bold">Your email<input name="email" type="email" required maxLength={200} className={field} /></label>
      <input name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="md:col-span-2 flex items-start gap-2 text-[14px]">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>I understand the listing is labelled as a paid listing, costs {price} a month until I cancel, and {siteName} reviews it before it goes live (full refund if it is declined).</span>
      </label>
      {err && <p className="md:col-span-2 bg-red-50 p-3 text-[14px] font-semibold text-red-800">{err}</p>}
      <button disabled={busy} className="md:col-span-2 bg-gray-900 px-6 py-3.5 text-[16px] font-black uppercase tracking-wider text-white disabled:opacity-60">{busy ? "Opening secure checkout…" : `Continue to payment · ${price}/month`}</button>
      <p className="md:col-span-2 text-[13px] text-gray-500">Secure card payment by Stripe. Cancel any time by replying to your receipt email.</p>
    </form>
  );
}
