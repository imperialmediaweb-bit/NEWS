"use client";

import { useState } from "react";

/** "Remove this listing" (small link that opens a short form). */
export default function RemoveRequest({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  if (state === "done") return <p className="text-[13px] font-semibold text-green-300">Request received. We&apos;ll remove {name} within one business day.</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-[13px] underline opacity-75 hover:opacity-100">Remove this listing</button>;
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setState("busy"); setErr(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/directory/remove", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name: f.get("name"), email: f.get("email"), reason: f.get("reason"), website: f.get("website") }) }).catch(() => null);
    if (r?.ok) setState("done"); else { setState("idle"); setErr((await r?.json().catch(() => null))?.error || "Something went wrong."); }
  }
  const field = "mt-1 w-full border border-white/30 bg-white px-2.5 py-2 text-[14px] text-gray-900";
  return (
    <form onSubmit={send} className="mt-2 space-y-2 border-t border-white/20 pt-3">
      <p className="text-[13.5px] font-bold">Remove {name} from the directory</p>
      <input name="name" required placeholder="Your name" className={field} />
      <input name="email" type="email" required placeholder="Your email" className={field} />
      <textarea name="reason" rows={2} placeholder="Reason (optional)" className={field} />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {err && <p className="text-[13px] text-red-200">{err}</p>}
      <button disabled={state === "busy"} className="bg-white px-3 py-1.5 text-[13px] font-black text-gray-900 disabled:opacity-60">{state === "busy" ? "Sending…" : "Send removal request"}</button>
    </form>
  );
}
