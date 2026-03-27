"use client";

import { SiteConfig } from "@/config/site-config";

interface BrandBannerProps {
  site: SiteConfig;
}

export default function BrandBanner({ site }: BrandBannerProps) {
  return (
    <section className="bg-white border-y-4 border-[#c1121f] my-6">
      <div className="max-w-[1300px] mx-auto px-4 py-6 flex flex-col md:flex-row items-center gap-6">
        {/* Logo */}
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-2xl md:text-3xl text-black" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            {site.logoFirst}
          </span>
          <span className="text-2xl md:text-3xl text-[#c1121f]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            {site.logoSecond}
          </span>
        </div>
        {/* About text */}
        <p className="text-gray-500 text-sm leading-relaxed text-center md:text-left flex-1">
          We cover what matters in {site.state} — politics, crime, sports, entertainment, and the stories
          that affect your life. No spin. Just the news.
        </p>
        {/* Subscribe button */}
        <a
          href="#"
          className="shrink-0 bg-[#c1121f] text-white px-8 py-3 text-[13px] font-black uppercase tracking-wider hover:bg-[#8b0000] transition-colors"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Subscribe Now
        </a>
      </div>
    </section>
  );
}
