"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getSiteByDomain, getActiveSite } from "@/config/sites";

export default function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    const domain = window.location.hostname.replace("www.", "");
    const site = getSiteByDomain(domain) || getActiveSite();

    // Fetch GA ID from DB for this site
    fetch(`/api/site-ga?slug=${site.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.gaId) setGaId(data.gaId);
      })
      .catch(() => {});
  }, []);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
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
