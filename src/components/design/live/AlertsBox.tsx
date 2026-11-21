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
    </div>
  );
}
