"use client";

import { AlertTriangle } from "lucide-react";

const breakingHeadlines = [
  "BREAKING: PM faces massive backbench rebellion over tax reform bill",
  "SHOCK: Premier League star arrested in match-fixing probe",
  "EXCLUSIVE: NHS whistleblower reveals A&E crisis 'worse than ever'",
  "URGENT: Bank of England hints at emergency rate cut amid market turmoil",
  "BREAKING: Royal family announces surprise state visit amid diplomatic row",
  "JUST IN: Met Police launch major counter-terror operation in East London",
];

export default function BreakingNewsTicker() {
  return (
    <div className="bg-tabloid-accent-red text-white overflow-hidden relative">
      <div className="flex items-center">
        <div className="bg-tabloid-dark-red px-4 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider shrink-0 z-10">
          <AlertTriangle className="w-4 h-4" />
          Breaking
        </div>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker flex whitespace-nowrap py-2">
            {[...breakingHeadlines, ...breakingHeadlines].map((headline, i) => (
              <span key={i} className="mx-8 text-sm font-medium cursor-pointer hover:underline">
                {headline}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
