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
  if (!slot && position === "mid") return <TodayIn className={className} />;
  if (!slot && position === "side") return <YourTown className={className} />;
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

type Story = { title: string; slug: string; category: string };
const link = (a: Story) => `/${(a.category || "local-news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}`;

/** "Today in {State}": weather, the top alert and five headlines, in the mid slot when no ad is set. */
function TodayIn({ className = "" }: { className?: string }) {
  const [d, setD] = useState<{ state: string; weather: { city: string; temp: number; short: string } | null; alert: { event: string } | null; stories: Story[] } | null>(null);
  useEffect(() => { fetch("/api/today").then((r) => r.json()).then(setD).catch(() => null); }, []);
  if (!d || !d.stories?.length) return null;
  return (
    <section className={`border-y-4 border-current py-5 ${className}`} aria-label={`Today in ${d.state}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[22px] font-black uppercase tracking-wide">Today in {d.state}</h2>
        <p className="text-[14px] opacity-80">
          {d.weather && <a href={`/weather/${d.weather.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="font-semibold">{d.weather.city} {d.weather.temp}° · {d.weather.short}</a>}
          {d.alert && <a href="/alerts" className="ml-3 font-bold text-[#b3121f]">⚠ {d.alert.event}</a>}
        </p>
      </div>
      <ol className="mt-3 grid gap-x-8 gap-y-2 md:grid-cols-2">
        {d.stories.map((a, i) => (
          <li key={a.slug} className="flex gap-3"><span className="text-[22px] font-black leading-none opacity-40">{i + 1}</span><a href={link(a)} className="text-[16px] font-semibold leading-snug hover:underline">{a.title}</a></li>
        ))}
      </ol>
    </section>
  );
}

/** "Your town": the reader picks a town once (remembered) and sees its latest stories, in the side slot. */
function YourTown({ className = "" }: { className?: string }) {
  const [towns, setTowns] = useState<string[]>([]);
  const [town, setTown] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem("express:town") || ""; } catch { /* ignore */ }
    fetch(`/api/town${saved ? `?town=${encodeURIComponent(saved)}` : ""}`).then((r) => r.json()).then((j) => { setTowns(j.towns || []); if (j.town) { setTown(j.town); setStories(j.stories || []); } }).catch(() => null);
  }, []);
  function pick(t: string) {
    setTown(t);
    try { localStorage.setItem("express:town", t); } catch { /* ignore */ }
    fetch(`/api/town?town=${encodeURIComponent(t)}`).then((r) => r.json()).then((j) => setStories(j.stories || [])).catch(() => null);
  }
  if (!towns.length) return null;
  const slug = town.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section className={`border border-current/20 p-4 ${className}`} aria-label="Your town">
      <label htmlFor="your-town" className="block text-[13px] font-black uppercase tracking-wider">Your town</label>
      <select id="your-town" value={town} onChange={(e) => pick(e.target.value)} className="mt-2 w-full border border-current/30 bg-transparent px-2 py-2 text-[15px]">
        <option value="">Choose your town…</option>
        {towns.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {town && (
        <div className="mt-3">
          {stories.length ? (
            <ul className="space-y-2">{stories.map((a) => <li key={a.slug}><a href={link(a)} className="text-[14.5px] font-semibold leading-snug hover:underline">{a.title}</a></li>)}</ul>
          ) : (
            <p className="text-[14px] opacity-75">No new stories from {town} this month yet.</p>
          )}
          <p className="mt-3 text-[13px] font-bold"><a href={`/city/${slug}`} className="underline">All {town} news ›</a></p>
        </div>
      )}
    </section>
  );
}
