"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock } from "lucide-react";

interface HeroSectionProps {
  main: Article;
  side: Article[];
}

export default function HeroSection({ main, side }: HeroSectionProps) {
  return (
    <section className="max-w-[1300px] mx-auto px-4 py-6">
      {/* Section header - red bar */}
      <div className="bg-[#c1121f] text-white text-center py-2.5 mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Local News
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Show main + side stories in equal 3-column grid */}
        {[main, ...side.slice(0, 2)].map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[380px] md:h-[450px] lg:h-[520px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Category badge */}
              <div className="absolute top-3 left-3">
                <span
                  className="bg-[#c1121f] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
              </div>
              {/* Title overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3">
                <h3
                  className="text-[15px] md:text-[17px] font-bold leading-snug text-black line-clamp-3"
                  style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}
                >
                  {article.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
              <Clock className="w-3 h-3 text-[#c1121f]" /> {article.date}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
