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
    // where the reader came from, for the owner's monthly report ("found 40 times on Google, 6 via ChatGPT")
    const ref = (document.referrer || "").toLowerCase(), utm = new URLSearchParams(location.search).get("utm_source")?.toLowerCase() || "";
    const src = /chatgpt|openai/.test(ref + utm) ? "chatgpt" : /perplexity/.test(ref + utm) ? "perplexity" : /google\./.test(ref) ? "google" : /bing\.|duckduckgo|yahoo\./.test(ref) ? "bing" : /facebook|instagram|t\.co|twitter|x\.com/.test(ref) ? "social" : utm === "qr" ? "qr" : ref && !ref.includes(location.hostname) ? "other" : "";
    if (src) send(`from_${src}`);
    const onClick = (e: MouseEvent) => { const a = (e.target as HTMLElement).closest("[data-track]"); if (a) send(a.getAttribute("data-track") || ""); };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);
  return null;
}
