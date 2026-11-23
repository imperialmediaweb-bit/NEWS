"use client";

import { useEffect, useState } from "react";

/** A red band at the top of every page while a serious NWS warning is active in the state. */
export default function AlertTicker() {
  const [alerts, setAlerts] = useState<{ event: string; area: string }[]>([]);
  useEffect(() => {
    fetch("/api/site-alerts").then((r) => r.json()).then((j) => setAlerts(j.alerts || [])).catch(() => null);
  }, []);
  if (!alerts.length) return null;
  return (
    <a href="/alerts" className="block bg-[#b3121f] text-white" role="alert">
      <span className="mx-auto flex max-w-[1340px] items-center gap-3 overflow-hidden px-4 py-2 text-[14px]">
        <span className="flex shrink-0 items-center gap-2 font-black uppercase tracking-wider">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" /></span>
          Weather alert
        </span>
        <span className="min-w-0 truncate font-semibold">{alerts.map((a) => `${a.event}: ${a.area}`).join("  ·  ")}</span>
        <span className="ml-auto hidden shrink-0 underline sm:inline">Details ›</span>
      </span>
    </a>
  );
}
