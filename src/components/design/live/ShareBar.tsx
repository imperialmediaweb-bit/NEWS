"use client";

import { useState } from "react";

/** Share buttons with the real share URLs of each network, plus copy link. */
export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const btn = "flex h-9 w-9 items-center justify-center border border-[#c9cfdc] text-[var(--lv-ink)] hover:border-[var(--lv-ink)] hover:bg-[#f3f5fa]";
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-[14px] font-bold text-[#1b2233]">Share</span>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener" aria-label="Share on Facebook">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M14 8V6c0-.9.6-1 1-1h2V2h-3c-3 0-4 2-4 4v2H8v3h2v11h4V11h3l.5-3H14z" /></svg>
      </a>
      <a className={btn} href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`} target="_blank" rel="noopener" aria-label="Share on X">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4L18.2 2zm-1.2 18h1.9L7.1 4H5.1L17 20z" /></svg>
      </a>
      <a className={btn} href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener" aria-label="Share on LinkedIn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9z" /></svg>
      </a>
      <a className={btn} href={`mailto:?subject=${t}&body=${u}`} aria-label="Share by email">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 7l9 6 9-6" /></svg>
      </a>
      <button
        className={btn}
        aria-label="Copy link"
        onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? "✓" : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>}
      </button>
    </div>
  );
}
