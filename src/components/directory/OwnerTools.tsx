"use client";

import { useState } from "react";

export function OwnerLogin({ acc }: { acc: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  if (state === "sent") return <p className="mt-6 bg-green-50 p-4 font-semibold text-green-800">If that email owns a listing, a sign-in link is on its way. Check your inbox (and spam).</p>;
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setState("busy"); await fetch("/api/directory/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", email }) }).catch(() => null); setState("sent"); }} className="mt-6 flex gap-2">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbusiness.com" className="min-w-0 flex-1 border border-gray-300 px-4 py-3 text-[16px]" />
      <button disabled={state === "busy"} className="px-5 py-3 font-black text-white disabled:opacity-60" style={{ background: acc }}>Send link</button>
    </form>
  );
}

export function ReplyBox({ token, reviewId, current, acc }: { token: string; reviewId: number; current: string | null; acc: string }) {
  const [reply, setReply] = useState(current || "");
  const [saved, setSaved] = useState(!!current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const call = async (action: string) => {
    setBusy(true); setErr(null);
    const r = await fetch("/api/directory/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, token, reviewId, reply }) }).then(async (x) => ({ ok: x.ok, j: await x.json() })).catch(() => null);
    setBusy(false);
    if (!r?.ok) { setErr(r?.j?.error || "Something went wrong."); return; }
    if (action === "suggest") { setReply(r.j.reply); setSaved(false); } else setSaved(true);
  };
  return (
    <div className="mt-3">
      <textarea value={reply} onChange={(e) => { setReply(e.target.value); setSaved(false); }} rows={3} maxLength={1000} placeholder="Your public reply…" className="w-full border border-gray-300 p-2.5 text-[14.5px]" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => call("suggest")} disabled={busy} className="rounded px-3 py-1.5 text-[13px] font-black text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}>✨ Write a reply for me</button>
        <button type="button" onClick={() => call("reply")} disabled={busy || reply.trim().length < 5 || saved} className="rounded px-3 py-1.5 text-[13px] font-black text-white disabled:opacity-50" style={{ background: acc }}>{saved ? "✓ Published" : "Publish reply"}</button>
        {err && <span className="text-[13px] font-semibold text-red-700">{err}</span>}
      </div>
    </div>
  );
}
