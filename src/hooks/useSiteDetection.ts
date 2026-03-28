"use client";

import { useEffect, useState } from "react";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { SiteConfig } from "@/config/site-config";

export function useSiteDetection() {
  const [site, setSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    try {
      const hostname = window.location.hostname || "";
      const detectedSite = getSiteByDomain(hostname) || getActiveSite();
      setSite(detectedSite);
    } catch {
      setSite(getActiveSite());
    }
  }, []);

  return site;
}
