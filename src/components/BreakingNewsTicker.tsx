"use client";

import { AlertTriangle } from "lucide-react";

interface BreakingNewsTickerProps {
  headlines: string[];
}

export default function BreakingNewsTicker({ headlines }: BreakingNewsTickerProps) {
  return (
    <div className="bg-tabloid-accent-red text-white overflow-hidden relative">
      <div className="flex items-center">
        <div className="bg-tabloid-dark-red px-4 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider shrink-0 z-10">
          <AlertTriangle className="w-4 h-4" />
          Breaking
        </div>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker flex whitespace-nowrap py-2">
            {[...headlines, ...headlines].map((headline, i) => (
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
