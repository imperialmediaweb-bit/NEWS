"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight page view tracker — sends a POST to /api/analytics/track
 * on every page navigation. No cookies, no external scripts.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure page has rendered
    const timeout = setTimeout(() => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || "",
          title: document.title || "",
        }),
      }).catch(() => {}); // Fire and forget
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
