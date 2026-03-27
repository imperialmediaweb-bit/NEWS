"use client";

import { motion } from "framer-motion";
import { SiteConfig } from "@/config/site-config";
import { Mail, ChevronRight } from "lucide-react";

interface BrandBannerProps {
  site: SiteConfig;
}

export default function BrandBanner({ site }: BrandBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-[1200px] mx-auto px-4 py-6"
    >
      <div className="bg-white border-2 border-gray-100 rounded-lg px-6 md:px-10 py-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-tabloid-red/10 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-tabloid-red" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {site.name.toUpperCase()}
          </h2>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed text-center md:text-left max-w-md">
          Be the first to see what&apos;s happening in {site.state} and beyond through our membership
          program. Subscribe and receive our newsletters and unlimited access.
        </p>
        <button
          className="bg-tabloid-red hover:bg-tabloid-dark-red text-white px-8 py-3 font-bold text-sm uppercase tracking-widest transition-all hover:shadow-lg rounded shrink-0 flex items-center gap-2"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          SUBSCRIBE <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.section>
  );
}
