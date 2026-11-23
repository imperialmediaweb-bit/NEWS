"use client";

import { useState } from "react";

/** Reader review: stars, text, name, email. Published after the email link is clicked. */
export default function ReviewForm({ slug, name, acc }: { slug: string; name: string; acc: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stars) { setErr("Choose 1 to 5 stars."); return; }
    setState("busy"); setErr(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/directory/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, rating: stars, body: f.get("body"), name: f.get("name"), email: f.get("email"), website: f.get("website") }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok) { setErr(j.error || "Something went wrong. Please try again."); setState("idle"); return; }
    setState("sent");
  }
  if (state === "sent") return <p className="bg-green-50 p-5 text-[16px] font-semibold text-green-800">Almost done! We sent you an email. Click the link in it to publish your review of {name}.</p>;
  const field = "mt-1 w-full border border-gray-300 bg-white px-3 py-2.5 text-[16px] focus:border-gray-900 focus:outline-none";
  return (
    <form onSubmit={submit} className="bg-white p-5 shadow-sm">
      <h2 className="text-[20px] font-black">Review {name}</h2>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className="text-[34px] leading-none transition-transform hover:scale-110" style={{ color: (hover || stars) >= n ? "#f59e0b" : "#d1d5db" }}>★</button>
        ))}
      </div>
      <label className="mt-3 block text-[14px] font-bold">Your experience<textarea name="body" required minLength={20} maxLength={2000} rows={4} className={field} placeholder="What did they do well? What could be better?" /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-[14px] font-bold">Your first name<input name="name" required maxLength={60} className={field} /></label>
        <label className="text-[14px] font-bold">Email <span className="font-normal text-gray-500">(never shown)</span><input name="email" type="email" required maxLength={200} className={field} /></label>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p className="mt-3 bg-red-50 p-3 text-[14px] font-semibold text-red-800">{err}</p>}
      <button disabled={state === "busy"} className="mt-4 px-6 py-3 text-[15px] font-black text-white disabled:opacity-60" style={{ background: acc }}>{state === "busy" ? "Sending…" : "Post review"}</button>
      <p className="mt-2 text-[12.5px] text-gray-500">One review per person per business. Honest reviews only: businesses can&apos;t pay to remove them. We confirm your email before publishing.</p>
    </form>
  );
}
