"use client";

import { SiteConfig } from "@/config/site-config";
import { Bookmark } from "lucide-react";

interface BrandBannerProps {
  site: SiteConfig;
}

export default function BrandBanner({ site }: BrandBannerProps) {
  return (
    <section className="py-8 border-y border-gray-200 my-6">
      <div className="max-w-[1300px] mx-auto px-4 flex flex-col md:flex-row items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Bookmark className="w-8 h-8 text-[#c1121f]" />
          <h2 className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl text-black" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {site.logoFirst}
            </span>
            <span className="text-2xl md:text-3xl text-[#c1121f]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {site.logoSecond}
            </span>
          </h2>
        </div>
        {/* About text */}
        <p className="text-gray-500 text-sm leading-relaxed text-center md:text-left" style={{ fontFamily: "'Libre Baskerville', serif" }}>
          We write about what is happening in {site.state} and beyond through our
          perspective — informed, involved, and inspired. Our mission is connecting
          {" "}{site.state} residents with the stories that matter most.
        </p>
        {/* Subscribe button */}
        <a
          href="#"
          className="shrink-0 bg-[#c1121f] text-white px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-[#9b111e] transition-colors"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Subscribe
        </a>
      </div>
    </section>
  );
}
