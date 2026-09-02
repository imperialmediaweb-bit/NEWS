"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ChevronRight } from "lucide-react";

interface LatestPostsGridProps {
  articles: Article[];
}

export default function LatestPostsGrid({ articles }: LatestPostsGridProps) {
  return (
    <section className="py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 border-b-[3px] border-[#1a1a1a] pb-2">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          <span className="w-1 h-6 rounded-full bg-[var(--accent)]" />
          Latest Posts
        </h2>
        <a href="#" className="text-[12px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline flex items-center gap-0.5" style={{ fontFamily: "'Oswald', sans-serif" }}>
          See All <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group cursor-pointer card-hover"
          >
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[260px] object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5">
                <span
                  className="bg-[var(--accent)] text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
              </div>
            </div>
            <h3
              className="mt-3 text-[15px] font-bold leading-tight group-hover:text-[var(--accent)] transition-colors line-clamp-2"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              {article.title}
            </h3>
            <span className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {article.date}
            </span>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
