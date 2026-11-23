"use client";

import { useEffect, useMemo, useState } from "react";

type Product = "sponsored" | "obituary" | "press_release";

/**
 * Order form for a sponsored story, a press release or an obituary.
 *  1. The details (product-specific fields).
 *  2. Photo, with a preview.
 *  3. "Write it for me" / "Improve my text": AI help that uses only what the
 *     customer typed; they edit the result.
 *  4. A preview of how it will look on the paper, the price, then Stripe.
 */
export default function PaidForm({ product, price, siteName, accent }: { product: Product; price: string; siteName: string; accent: string }) {
  const release = product === "press_release";
  const obituary = product === "obituary";
  const [f, setF] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [feature, setFeature] = useState(false);
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    if (!photo) { setPhotoUrl(null); return; }
    const u = URL.createObjectURL(photo);
    setPhotoUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  function pickPhoto(file: File | undefined | null) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) { setMsg({ ok: false, text: "The photo must be JPG, PNG or WebP." }); return; }
    if (file.size > 8 * 1024 * 1024) { setMsg({ ok: false, text: "The photo must be under 8 MB." }); return; }
    setPhoto(file); setMsg(null);
  }

  // obituary: headline and closing details built from the fields
  const obitTitle = obituary && f.full_name ? `${f.full_name}${f.born || f.died ? `, ${[f.born, f.died].filter(Boolean).join(" – ")}` : ""}` : "";
  const service = obituary ? [
    f.service_date || f.service_place ? `A service will be held${f.service_date ? ` ${f.service_date}` : ""}${f.service_place ? ` at ${f.service_place}` : ""}.` : "",
    f.funeral_home ? `Arrangements are by ${f.funeral_home}.` : "",
    f.memorials ? `In lieu of flowers: ${f.memorials}.` : "",
  ].filter(Boolean).join(" ") : "";
  const releaseContact = release && (f.contact_name || f.contact_phone || f.contact_email) ? `Media contact: ${[f.contact_name, f.contact_phone, f.contact_email].filter(Boolean).join(", ")}` : "";

  const finalTitle = obituary ? (title || obitTitle) : title;
  const finalBody = useMemo(() => [body.trim(), obituary && service && !body.includes(service) ? service : "", releaseContact && !body.includes(releaseContact) ? releaseContact : ""].filter(Boolean).join("\n\n"), [body, obituary, service, releaseContact]);

  async function write() {
    setWriting(true); setMsg(null);
    const payload = { product, ...f, current_headline: title, current_text: body };
    const r = await fetch("/api/paid/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    setWriting(false);
    if (!r?.ok) { setMsg({ ok: false, text: r?.j?.error || "The writing assistant is busy. Try again in a minute." }); return; }
    if (r.j.title && !obituary) setTitle(r.j.title);
    if (r.j.title && obituary && !title) setTitle(r.j.title);
    setBody(r.j.body);
    setMsg({ ok: true, text: "Done. Read it carefully and change anything that isn't exactly right." });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (finalTitle.trim().length < 8) { setMsg({ ok: false, text: obituary ? "Add the full name." : "Add a headline (at least 8 characters)." }); return; }
    if (finalBody.trim().length < 80) { setMsg({ ok: false, text: "The text is too short. Use “Write it for me” or add a few sentences." }); return; }
    setBusy(true); setMsg(null);
    const data = new FormData(e.currentTarget);
    data.set("product", product === "sponsored" && feature ? "featured" : product);
    data.set("title", finalTitle.trim());
    data.set("body", finalBody.trim());
    if (photo) data.set("photo", photo);
    try {
      const r = await fetch("/api/paid/checkout", { method: "POST", body: data });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) throw new Error(j.error || "Please try again.");
      window.location.href = j.url;
    } catch (e2) {
      setMsg({ ok: false, text: e2 instanceof Error ? e2.message : "Please try again." });
      setBusy(false);
    }
  }

  const input = "mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-[16px] focus:border-gray-900 focus:outline-none";
  const L = (k: string, label: string, opts: { hint?: string; type?: string; placeholder?: string; required?: boolean; name?: string } = {}) => (
    <label className="block text-[14px] font-bold">{label}{opts.hint && <span className="font-normal text-gray-500"> ({opts.hint})</span>}
      <input name={opts.name} value={f[k] || ""} onChange={set(k)} type={opts.type || "text"} placeholder={opts.placeholder} required={opts.required} maxLength={300} className={input} />
    </label>
  );
  const step = (n: number, t: string) => <h3 className="flex items-center gap-2 text-[18px] font-black"><span className="grid h-7 w-7 place-items-center rounded-full text-[14px] text-white" style={{ background: accent }}>{n}</span>{t}</h3>;
  const total = product === "sponsored" && feature ? `${price} + $100` : price;
  const label = obituary ? "Obituary" : release ? "Press release" : "Sponsored";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-3 bg-white p-5 shadow-sm md:p-6">
        {step(1, obituary ? "About your loved one" : release ? "About the release" : "About your business and story")}
        {obituary ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">{L("full_name", "Full name", { required: true, placeholder: "John Allen Smith" })}</div>
            {L("born", "Born", { placeholder: "March 4, 1948" })}
            {L("died", "Died", { placeholder: "November 20, 2026" })}
            {L("city", "City or town")}
            {L("funeral_home", "Funeral home", { hint: "optional" })}
            {L("service_date", "Service date and time", { hint: "optional", placeholder: "Saturday, Nov. 28, at 11 a.m." })}
            {L("service_place", "Service place", { hint: "optional" })}
            <div className="md:col-span-2">{L("memorials", "Memorial donations", { hint: "optional", placeholder: "donations to the local food bank" })}</div>
            <label className="block text-[14px] font-bold md:col-span-2">Life, family and what made them special <span className="font-normal text-gray-500">(notes are fine, we help you write it)</span>
              <textarea value={f.notes || ""} onChange={set("notes")} rows={4} maxLength={2500} className={input} placeholder="Retired teacher, 35 years at Lincoln Elementary. Loved fishing and his grandchildren. Survived by wife Mary, sons Tom and Bill, five grandchildren." />
            </label>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {L("business", release ? "Company or organization" : "Business name", { name: "business", required: true })}
            {L("website", "Website", { name: "website", hint: "optional", type: "url", placeholder: "https://" })}
            {L("city", "City or town")}
            {release ? L("date", "Date of the news", { hint: "optional" }) : L("when", "Dates or opening hours", { hint: "optional" })}
            <label className="block text-[14px] font-bold md:col-span-2">{release ? "What is the news?" : "What do you want readers to know?"} <span className="font-normal text-gray-500">(notes are fine, we help you write it)</span>
              <textarea value={f.notes || ""} onChange={set("notes")} rows={4} maxLength={2500} className={input} placeholder={release ? "Opening a second location on Main Street in March, adding 20 jobs. Quote from owner Jane Lee: ..." : "Family bakery, open since 2015. Grand opening of our new shop on Main Street Saturday 9-5, free coffee for the first 100 guests."} />
            </label>
            {release && <>
              {L("contact_name", "Media contact name")}
              {L("contact_phone", "Media contact phone", { type: "tel" })}
              <div className="md:col-span-2">{L("contact_email", "Media contact email", { type: "email" })}</div>
            </>}
          </div>
        )}
      </section>

      <section className="space-y-3 bg-white p-5 shadow-sm md:p-6">
        {step(2, obituary ? "A photo" : release ? "Logo or photo" : "A photo")}
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickPhoto(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-500"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="max-h-64 max-w-full object-contain" />
          ) : (
            <span className="text-[15px] text-gray-600">📷 <b>Click to choose a photo</b> or drag it here<br /><span className="text-[13px]">JPG, PNG or WebP, up to 8 MB. Landscape works best.</span></span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
        {photo && <button type="button" onClick={() => setPhoto(null)} className="text-[13px] underline">Remove photo</button>}
      </section>

      <section className="space-y-3 bg-white p-5 shadow-sm md:p-6">
        {step(3, "The text")}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={write} disabled={writing} className="px-5 py-2.5 text-[15px] font-black text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}>
            {writing ? "Writing…" : body ? "✨ Improve my text" : "✨ Write it for me"}
          </button>
          <span className="text-[13px] text-gray-500">Uses only what you wrote above. Nothing is made up. You can edit everything.</span>
        </div>
        {!obituary && (
          <label className="block text-[14px] font-bold">{release ? "Headline" : "Headline"}
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={input} placeholder={release ? "Main Street Bakery opens second location, adds 20 jobs" : "Grand opening: Main Street Bakery now open in Dayton"} />
          </label>
        )}
        {obituary && (
          <label className="block text-[14px] font-bold">Headline <span className="font-normal text-gray-500">(made from the name and dates; you can change it)</span>
            <input value={title || obitTitle} onChange={(e) => setTitle(e.target.value)} maxLength={160} className={input} />
          </label>
        )}
        <label className="block text-[14px] font-bold">{obituary ? "Obituary text" : release ? "Press release text" : "Your story"}
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} maxLength={6000} className={input} placeholder="Use “Write it for me”, or write it here." />
        </label>
      </section>

      <section className="space-y-3 bg-white p-5 shadow-sm md:p-6">
        {step(4, "Preview")}
        <div className="border border-gray-200 bg-[#fafafa] p-5">
          <span className="inline-block px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white" style={{ background: obituary ? "#374151" : accent }}>{label}</span>
          <h4 className="mt-2 font-serif text-[26px] font-bold leading-tight">{finalTitle || (obituary ? "Full name, born – died" : "Your headline")}</h4>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="mt-3 max-h-80 w-full object-cover" />
          )}
          <div className="mt-3 space-y-3 font-serif text-[17px] leading-relaxed text-gray-800">
            {(finalBody || "Your text will appear here.").split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {!obituary && f.website && <p className="mt-3 text-[15px] font-bold" style={{ color: accent }}>Visit {f.business || "the website"} ›</p>}
          <p className="mt-3 text-[12.5px] italic text-gray-500">{obituary ? `Published on ${siteName}.` : release ? `Press release from ${f.business || "your company"}, published as submitted. Paid placement on ${siteName}.` : `Sponsored content from ${f.business || "your business"}. ${siteName} was paid to publish it.`}</p>
        </div>
      </section>

      <section className="space-y-3 bg-white p-5 shadow-sm md:p-6">
        {step(5, "Your details and payment")}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-[14px] font-bold">Your name<input name="name" required maxLength={120} className={input} /></label>
          <label className="block text-[14px] font-bold">Email <span className="font-normal text-gray-500">(receipt and link)</span><input name="email" type="email" required maxLength={200} className={input} /></label>
        </div>
        {product === "sponsored" && (
          <label className="flex items-start gap-2 border border-amber-300 bg-amber-50 p-3 text-[14px] text-gray-800">
            <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} className="mt-1" />
            <span><b>Feature it on the homepage for 7 days (+$100).</b> Your story appears as a highlighted sponsored card near the top of the front page.</span>
          </label>
        )}
        <input name="company_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>
            {obituary
              ? `The information is accurate and I have the right to share it and the photo. ${siteName} may edit for length and style.`
              : release
              ? `I have the right to publish this release and photo. ${siteName} publishes it labelled "Press release" as paid content, does not edit its claims, may decline it, and refunds in full if declined.`
              : `The text and photo are mine or I have the right to use them. ${siteName} publishes it labelled "Sponsored", may edit or decline it, and refunds in full if declined.`}
          </span>
        </label>
        {msg && <p className={`p-3 text-[14.5px] font-semibold ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{msg.text}</p>}
        <button disabled={busy} className="w-full px-6 py-4 text-[17px] font-black uppercase tracking-wider text-white disabled:opacity-60" style={{ background: accent }}>
          {busy ? "Opening secure checkout…" : `Continue to secure payment · ${total}`}
        </button>
        <p className="text-center text-[13px] text-gray-500">Card payment by Stripe. {obituary ? "Published within one business day." : "Live within one business day. Full refund if we decline it."}</p>
      </section>
    </form>
  );
}
