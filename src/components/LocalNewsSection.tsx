"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface LocalNewsSectionProps {
  articles: Article[];
}

export default function LocalNewsSection({ articles }: LocalNewsSectionProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex justify-center mb-6">
        <h2
          className="bg-tabloid-red text-white px-6 py-2 text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LOCAL NEWS
        </h2>
      </div>

      {/* 3 cards in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[220px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dark gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3
                  className="text-white font-bold text-base leading-tight"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {article.title}
                </h3>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="text-tabloid-red font-semibold uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {article.category}
              </span>
              <span>-</span>
              <span>{article.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
