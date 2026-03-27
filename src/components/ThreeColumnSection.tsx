"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { ChevronRight } from "lucide-react";

interface ThreeColumnSectionProps {
  columns: {
    title: string;
    accent: string;
    articles: Article[];
  }[];
}

export default function ThreeColumnSection({ columns }: ThreeColumnSectionProps) {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col, colIdx) => (
          <div key={colIdx}>
            {/* Column header - red bar */}
            <div className="text-white text-center py-2 mb-4" style={{ backgroundColor: col.accent }}>
              <h2 className="text-sm font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {col.title}
              </h2>
            </div>

            {/* Lead article with image */}
            {col.articles[0] && (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group cursor-pointer mb-4"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={col.articles[0].img}
                    alt={col.articles[0].title}
                    className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3
                  className="mt-2 text-[15px] font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-3"
                  style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}
                >
                  {col.articles[0].title}
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 block">{col.articles[0].date}</span>
              </motion.article>
            )}

            {/* Rest as list items */}
            <div className="space-y-3">
              {col.articles.slice(1).map((article, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 group cursor-pointer pb-3 border-b border-gray-100"
                >
                  <img src={article.img} alt={article.title} className="w-[80px] h-[60px] object-cover shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold leading-tight group-hover:text-[#c1121f] transition-colors line-clamp-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">{article.date}</span>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* More button */}
            <a href="#" className="flex items-center gap-1 mt-3 text-[11px] font-bold uppercase tracking-wider hover:underline" style={{ color: col.accent, fontFamily: "'Oswald', sans-serif" }}>
              More {col.title} <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
