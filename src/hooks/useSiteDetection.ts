"use client";

import { useEffect, useState } from "react";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { SiteConfig } from "@/config/site-config";

export function useSiteDetection() {
  const [site, setSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const domain = window.location.hostname.replace("www.", "");
    const detectedSite = getSiteByDomain(domain) || getActiveSite();
    setSite(detectedSite);
  }, []);

  return site;
}
