"use client";

import { useEffect } from "react";

/**
 * While a new design is previewed with ?design=nou, keep every internal link
 * in the preview, so clicking around shows the new design and not the old.
 * Does nothing on a normal visit.
 */
export default function PreviewLinks() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("design");
    if (p !== "nou") return;
    for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.searchParams.has("design")) continue;
      url.searchParams.set("design", "nou");
      a.href = url.pathname + url.search + url.hash;
    }
  }, []);
  return null;
}
