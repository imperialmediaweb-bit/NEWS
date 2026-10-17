"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

/**
 * Meta (Facebook) pixel, for measuring and retargeting advertising.
 *
 * Loaded only after the visitor has accepted cookies. The pixel is not
 * analytics the site needs to function — it reports a named visitor's
 * behaviour to a third party for advertising — so firing it before consent
 * would make the consent banner decorative, and these sites serve readers in
 * states with their own privacy statutes as well as EU visitors.
 *
 * Set FACEBOOK_PIXEL_ID (or NEXT_PUBLIC_FACEBOOK_PIXEL_ID) to switch it on.
 * Absent, this renders nothing at all.
 */
export default function FacebookPixel({ pixelId }: { pixelId?: string }) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setConsented(localStorage.getItem("cookie_consent") === "accepted");
      } catch {
        // Private browsing or blocked storage: treat as no consent.
        setConsented(false);
      }
    };
    read();

    // The banner writes consent after this mounts, so pick it up without
    // making the reader reload to be counted.
    window.addEventListener("storage", read);
    const timer = setInterval(read, 2000);
    return () => {
      window.removeEventListener("storage", read);
      clearInterval(timer);
    };
  }, []);

  if (!pixelId || !consented) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
