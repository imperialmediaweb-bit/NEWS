"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface PopularSectionProps {
  articles: Article[];
}

export default function PopularSection({ articles }: PopularSectionProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex justify-center mb-6">
        <h2
          className="bg-tabloid-red text-white px-6 py-2 text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          POPULAR
        </h2>
      </div>

      {/* 4 cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {articles.map((article, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-3 cursor-pointer group"
          >
            <img
              src={article.img}
              alt={article.title}
              className="w-[100px] h-[75px] object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity"
            />
            <div className="flex flex-col justify-center">
              <span
                className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {article.category}
              </span>
              <h3
                className="text-sm font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-2"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {article.title}
              </h3>
              <span className="text-[10px] text-gray-400 mt-1">{article.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
