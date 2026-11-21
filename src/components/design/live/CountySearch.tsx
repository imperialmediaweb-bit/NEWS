"use client";

import { useMemo, useState } from "react";

/** "Your county": every county of the state, filterable, each linking to its news. */
export default function CountySearch({ state, counties, popular }: { state: string; counties: string[]; popular: string[] }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all ? counties : popular;
    return counties.filter((c) => c.toLowerCase().includes(t)).slice(0, 10);
  }, [q, counties, popular, all]);
  const href = (c: string) => `/search?q=${encodeURIComponent(`${c} County`)}`;

  return (
    <div>
      <label className="sr-only" htmlFor="county-q">Search a {state} county</label>
      <input
        id="county-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a county (e.g., Travis, Harris)"
        className="w-full border border-[#c9cfdc] px-3 py-2 text-[14px] outline-none focus:border-[var(--lv-ink)]"
      />
      <p className="mt-3 mb-1 text-[12px] font-semibold uppercase tracking-wider text-[#5a6275]">{q ? "Matches" : all ? `All ${counties.length} counties` : "Popular counties"}</p>
      <ul className={`grid grid-cols-2 gap-x-4 ${all && !q ? "max-h-[260px] overflow-y-auto pr-1" : ""}`}>
        {shown.map((c) => (
          <li key={c} className="border-b border-[#e3e6ee]">
            <a href={href(c)} className="flex justify-between py-1.5 text-[14px] text-[var(--lv-ink)] hover:text-[var(--lv-acc)]">
              {c} <span aria-hidden>›</span>
            </a>
          </li>
        ))}
        {shown.length === 0 && <li className="col-span-2 py-2 text-[14px] text-[#5a6275]">No county by that name.</li>}
      </ul>
      {!q && (
        <button onClick={() => setAll(!all)} className="mt-3 w-full border border-[var(--lv-ink)] py-2 text-[12px] font-bold uppercase tracking-wide text-[var(--lv-ink)] hover:bg-[var(--lv-ink)] hover:text-white">
          {all ? "Show popular counties" : `Browse all ${counties.length} counties →`}
        </button>
      )}
    </div>
  );
}
