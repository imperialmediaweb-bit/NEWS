"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { TrendingUp } from "lucide-react";

interface PopularSectionProps {
  articles: Article[];
}

export default function PopularSection({ articles }: PopularSectionProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex justify-center mb-8">
        <h2
          className="bg-tabloid-red text-white px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-md flex items-center gap-2"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          <TrendingUp className="w-4 h-4" /> POPULAR
        </h2>
      </div>

      {/* 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {articles.map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 cursor-pointer group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative overflow-hidden rounded-md shrink-0 w-[110px] h-[85px]">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span
                className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {article.category}
              </span>
              <h3
                className="text-[13px] font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-3"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {article.title}
              </h3>
              <span className="text-[10px] text-gray-400 mt-1.5">{article.date}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
