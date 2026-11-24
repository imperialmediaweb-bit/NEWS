"use client";

import { useEffect } from "react";

/** Counts a view of the business page and clicks on [data-track] links (call, website, directions). */
export default function BizTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (kind: string) => {
      const body = JSON.stringify({ slug, kind });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/directory/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/directory/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };
    send("view");
    const onClick = (e: MouseEvent) => { const a = (e.target as HTMLElement).closest("[data-track]"); if (a) send(a.getAttribute("data-track") || ""); };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);
  return null;
}
