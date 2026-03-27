"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock } from "lucide-react";

interface LocalNewsSectionProps {
  articles: Article[];
}

export default function LocalNewsSection({ articles }: LocalNewsSectionProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10">
      {/* Section header */}
      <div className="flex justify-center mb-8">
        <h2
          className="bg-tabloid-red text-white px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-md"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LOCAL NEWS
        </h2>
      </div>

      {/* 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="group cursor-pointer card-lift rounded-lg overflow-hidden bg-white shadow-md"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[300px] object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className="bg-tabloid-red text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 shadow-lg"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3
                  className="text-white font-bold text-lg leading-snug drop-shadow-lg"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                >
                  {article.title}
                </h3>
              </div>
            </div>
            <div className="px-5 py-3 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3 text-tabloid-red" />
              <span>{article.date}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
