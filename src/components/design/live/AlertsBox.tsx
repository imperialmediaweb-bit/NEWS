"use client";

import { useEffect, useState } from "react";

/**
 * In the mockup's newsletter slot: breaking-news alerts in the browser,
 * which the network already sends (web push, /api/push). The button asks the
 * site-wide PushNotification component to subscribe, so there is one
 * subscription path, not two.
 */
export default function AlertsBox({ name, state }: { name: string; state: string }) {
  const [status, setStatus] = useState<"idle" | "on" | "blocked" | "unsupported">("idle");
  const [mail, setMail] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [mailMsg, setMailMsg] = useState("");
  const subscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMail("sending");
    try {
      const r = await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.get("email"), website: f.get("website") }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Please try again.");
      setMail("sent");
      setMailMsg(j.already ? "You're already subscribed." : "Check your inbox to confirm.");
    } catch (err) {
      setMail("error");
      setMailMsg(err instanceof Error ? err.message : "Please try again.");
    }
  };
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) setStatus("unsupported");
    else if (Notification.permission === "granted") setStatus("on");
    else if (Notification.permission === "denied") setStatus("blocked");
  }, []);

  const ask = () => {
    window.dispatchEvent(new Event("express:alerts"));
    const t = setInterval(() => {
      if (Notification.permission === "granted") { setStatus("on"); clearInterval(t); }
      if (Notification.permission === "denied") { setStatus("blocked"); clearInterval(t); }
    }, 500);
    setTimeout(() => clearInterval(t), 30000);
  };

  return (
    <div className="flex flex-col justify-center border border-[#dde1ea] p-5">
      <h2 className="text-[18px] font-extrabold uppercase text-[var(--lv-ink)]">Get {name} alerts</h2>
      <p className="mt-1 text-[14px] text-[#4a5266]">The biggest {state} stories, the moment they break.</p>
      {status === "on" ? (
        <p className="mt-3 text-[14px] font-semibold text-[#1f7a3f]">✓ Alerts are on in this browser.</p>
      ) : status === "blocked" ? (
        <p className="mt-3 text-[13px] text-[#6b7386]">Alerts are blocked in this browser&apos;s settings.</p>
      ) : status === "unsupported" ? (
        <p className="mt-3 text-[13px] text-[#6b7386]">This browser does not support alerts.</p>
      ) : (
        <button onClick={ask} className="mt-3 w-fit bg-[var(--lv-acc)] px-5 py-2.5 text-[14px] font-bold uppercase text-white">Turn on alerts</button>
      )}
      <div className="mt-4 border-t border-[#dde1ea] pt-4">
        <p className="text-[14px] font-bold text-[var(--lv-ink)]">Morning newsletter</p>
        <p className="text-[13px] text-[#4a5266]">The day&apos;s top {state} news in your inbox, once a day. Free.</p>
        {mail === "sent" ? (
          <p className="mt-2 text-[14px] font-semibold text-[#1f7a3f]">✓ {mailMsg}</p>
        ) : (
          <form onSubmit={subscribe} className="mt-2 flex gap-2">
            <input name="email" type="email" required placeholder="you@email.com" aria-label="Email address" className="min-w-0 flex-1 border border-[#c9cfdb] px-3 py-2 text-[14px] text-[#1b2233]" />
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <button disabled={mail === "sending"} className="bg-[var(--lv-ink)] px-4 py-2 text-[13px] font-bold uppercase text-white disabled:opacity-60">{mail === "sending" ? "…" : "Sign up"}</button>
          </form>
        )}
        {mail === "error" && <p className="mt-1 text-[13px] text-red-700">{mailMsg}</p>}
      </div>
    </div>
  );
}
