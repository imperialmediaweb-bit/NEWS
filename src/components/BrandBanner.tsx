"use client";

import { motion } from "framer-motion";
import { SiteConfig } from "@/config/site-config";

interface BrandBannerProps {
  site: SiteConfig;
}

export default function BrandBanner({ site }: BrandBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-[1200px] mx-auto px-4 py-8"
    >
      <div className="border border-gray-200 bg-white px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <h2
          className="text-3xl md:text-4xl font-black tracking-tight flex-shrink-0"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {site.name.toUpperCase()}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed text-center md:text-left max-w-xl">
          Be the first to see what&apos;s happening in {site.state} and beyond through our membership
          program. Subscribe and receive our newsletters and unlimited access.
        </p>
        <button
          className="bg-tabloid-red hover:bg-tabloid-dark-red text-white px-8 py-3 font-bold text-sm uppercase tracking-widest transition-colors flex-shrink-0"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          SUBSCRIBE
        </button>
      </div>
    </motion.section>
  );
}
