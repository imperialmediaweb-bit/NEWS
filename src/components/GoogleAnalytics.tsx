"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getSiteByDomain, getActiveSite } from "@/config/sites";

export default function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    // Analytics waits for the reader: the first scroll, tap or key, or four
    // seconds, so it never competes with the page's first paint.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      ["scroll", "pointerdown", "keydown", "touchstart"].forEach((e) => window.removeEventListener(e, start));
      load();
    };
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, start, { passive: true, once: true }));
    const t = setTimeout(start, 4000);
    return () => {
      clearTimeout(t);
      ["scroll", "pointerdown", "keydown", "touchstart"].forEach((e) => window.removeEventListener(e, start));
    };
  }, []);

  function load() {
    const domain = window.location.hostname.replace("www.", "");
    const site = getSiteByDomain(domain) || getActiveSite();

    // Fetch GA ID from DB for this site
    fetch(`/api/site-ga?slug=${site.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.gaId) setGaId(data.gaId);
      })
      .catch(() => {});
  }

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
