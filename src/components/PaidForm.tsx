"use client";

import { useState } from "react";

/** Order form for a sponsored story or an obituary; payment happens on Stripe Checkout. */
export default function PaidForm({ product, price, siteName, accent }: { product: "sponsored" | "obituary" | "press_release"; price: string; siteName: string; accent: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const release = product === "press_release";
  const sponsored = product === "sponsored" || release;
  const [feature, setFeature] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const data = new FormData(e.currentTarget);
    data.set("product", product === "sponsored" && feature ? "featured" : product);
    try {
      const r = await fetch("/api/paid/checkout", { method: "POST", body: data });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) throw new Error(j.error || "Please try again.");
      window.location.href = j.url;
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Please try again.");
      setBusy(false);
    }
  }
  const input = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[15px]";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sponsored && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[14px] font-semibold">Business name<input name="business" required maxLength={160} className={input} /></label>
          <label className="block text-[14px] font-semibold">Website (optional)<input name="website" type="url" maxLength={300} className={input} placeholder="https://" /></label>
        </div>
      )}
      <label className="block text-[14px] font-semibold">
        {release ? "Press release headline" : sponsored ? "Headline" : "Name of the deceased and dates"}
        <input name="title" required minLength={8} maxLength={160} className={input} placeholder={sponsored ? "Grand opening: Main Street Bakery now open in Dayton" : "John A. Smith, 1948 – 2026"} />
      </label>
      <label className="block text-[14px] font-semibold">
        {release ? "Press release text, as you want it published (include the city, date and a media contact)" : sponsored ? "Your story (we may edit for length and clarity)" : "Obituary text: life, family, service details"}
        <textarea name="body" required minLength={80} maxLength={6000} rows={8} className={input} />
      </label>
      <label className="block text-[14px] font-semibold">Photo (optional, JPG/PNG/WebP up to 8 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[14px]" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[14px] font-semibold">Your name<input name="name" required maxLength={120} className={input} /></label>
        <label className="block text-[14px] font-semibold">Email (for the receipt)<input name="email" type="email" required maxLength={200} className={input} /></label>
      </div>
      {product === "sponsored" && (
        <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-[14px] text-gray-800">
          <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} className="mt-1" />
          <span><b>Feature it on the homepage for 7 days (+$100).</b> Your story appears as a highlighted sponsored card near the top of the front page.</span>
        </label>
      )}
      <input name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          {release
            ? `I have the right to publish this release. ${siteName} publishes it labelled "Press release" as paid content, does not edit its claims, may decline it, and refunds in full if declined.`
            : sponsored
            ? `The text and photo are mine or I have the right to use them. ${siteName} publishes it labelled "Sponsored", may edit or decline it, and refunds in full if declined.`
            : `I am family or authorized to place this notice, and the photo is mine or I have the right to use it. ${siteName} may edit it and refunds in full if declined.`}
        </span>
      </label>
      {err && <p className="text-[14px] font-semibold text-red-700">{err}</p>}
      <button disabled={busy} className="rounded px-6 py-3 text-[15px] font-bold text-white disabled:opacity-60" style={{ background: accent }}>
        {busy ? "Opening secure payment…" : `Continue to payment — ${sponsored && feature ? `$${Number(price.replace(/[^0-9]/g, "")) + 100}` : price}`}
      </button>
      <p className="text-[12.5px] text-gray-500">Secure card payment by Stripe. Reviewed by an editor within one business day.{sponsored && " Casinos, gaming and 18+ shows are $99; the payment page shows the final price."}</p>
    </form>
  );
}
