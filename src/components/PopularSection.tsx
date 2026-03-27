"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface PopularSectionProps {
  articles: Article[];
}

export default function PopularSection({ articles }: PopularSectionProps) {
  return (
    <section className="py-6">
      {/* Red bar header */}
      <div className="bg-[#c1121f] text-white text-center py-2.5 mb-5">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Popular
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {articles.slice(0, 6).map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[120px] object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-1.5 left-1.5">
                <span className="bg-[#c1121f] text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {article.category}
                </span>
              </div>
            </div>
            <h4 className="mt-1.5 text-[12px] font-bold leading-tight group-hover:text-[#c1121f] transition-colors line-clamp-3" style={{ fontFamily: "'Source Serif 4', serif" }}>
              {article.title}
            </h4>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
