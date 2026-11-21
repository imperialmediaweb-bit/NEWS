"use client";

import { useEffect, useState } from "react";

/** Phone menu for the live designs: a hamburger that opens the sections full width. */
export default function MobileMenu({ nav }: { nav: Array<[string, string]> }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center text-[var(--lv-ink)] md:hidden">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--lv-ink)] text-white md:hidden" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] font-bold uppercase tracking-widest text-white/70">Sections</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto px-4">
            {nav.map(([l, h]) => (
              <li key={l} className="border-b border-white/15">
                <a href={h === "#weather" ? "/#weather" : h} onClick={() => setOpen(false)} className="flex items-center justify-between py-4 text-[22px] font-bold">
                  {l} <span aria-hidden className="text-white/50">›</span>
                </a>
              </li>
            ))}
            <li className="border-b border-white/15">
              <a href="/search" className="flex items-center justify-between py-4 text-[22px] font-bold">Search <span aria-hidden className="text-white/50">›</span></a>
            </li>
          </ul>
          <div className="flex gap-3 px-4 py-5">
            <a href="/contact" className="flex-1 border border-white/40 py-3 text-center text-[14px] font-bold uppercase">Contact</a>
            <a href="/advertise" className="flex-1 bg-[var(--lv-acc)] py-3 text-center text-[14px] font-bold uppercase">Advertise</a>
          </div>
        </div>
      )}
    </>
  );
}
