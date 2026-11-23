"use client";

import { useEffect, useState } from "react";

/**
 * Fixed ad positions shared by every per-state design: after the lead,
 * between sections and in the sidebar, so ads are set up once for all 50
 * sites. AdSense is already loaded in the root layout (auto ads); a fixed
 * slot shows only when its AdSense slot id is set in the environment
 * (NEXT_PUBLIC_AD_SLOT_TOP / _MID / _SIDE). Until then it renders nothing,
 * so no empty boxes appear on the page.
 */
const SLOTS = {
  top: process.env.NEXT_PUBLIC_AD_SLOT_TOP,
  mid: process.env.NEXT_PUBLIC_AD_SLOT_MID,
  side: process.env.NEXT_PUBLIC_AD_SLOT_SIDE,
} as const;

export default function AdSlot({ position, className = "" }: { position: keyof typeof SLOTS; className?: string }) {
  const slot = SLOTS[position];
  // the top slot also carries a paid "Featured" sponsored story when one is running
  const [feat, setFeat] = useState<{ title: string; business: string | null; photo_url: string | null; article_slug: string } | null>(null);
  useEffect(() => {
    if (position !== "top") return;
    fetch("/api/featured").then((r) => r.json()).then((j) => setFeat(j.featured)).catch(() => null);
  }, [position]);
  useEffect(() => {
    if (!slot) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ||= []).push({});
    } catch {
      /* the ad script may be blocked; the page stays as it is */
    }
  }, [slot]);
  if (feat) {
    return (
      <a href={`/${feat.article_slug}`} className={`group flex items-center gap-4 border border-amber-300 bg-amber-50 p-3 text-[#1b2233] ${className}`}>
        {feat.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={feat.photo_url} alt="" className="h-20 w-28 shrink-0 object-cover" loading="lazy" />
        )}
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700">Sponsored{feat.business ? ` · ${feat.business}` : ""}</span>
          <span className="block text-[17px] font-bold leading-snug group-hover:underline">{feat.title}</span>
        </span>
      </a>
    );
  }
  if (!slot) return null;
  return (
    <div className={`text-center ${className}`}>
      <p className="mb-1 text-[10px] uppercase tracking-[.12em] text-[#9a9a9a]">Advertisement</p>
      <ins className="adsbygoogle block" style={{ display: "block" }} data-ad-client="ca-pub-3341252465268510" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
