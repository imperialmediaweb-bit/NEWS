"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface USNewsSectionProps {
  articles: Article[];
}

export default function USNewsSection({ articles }: USNewsSectionProps) {
  const featured = articles[0];
  const sideArticles = articles.slice(1, 4);
  const bottomArticles = articles.slice(4);

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex justify-center mb-6">
        <h2
          className="bg-tabloid-red text-white px-6 py-2 text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          US NEWS
        </h2>
      </div>

      {/* Main row: featured left + grid right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured article */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="cursor-pointer group"
          >
            <div className="relative overflow-hidden">
              <img
                src={featured.img}
                alt={featured.title}
                className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="mt-3">
              <span
                className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {featured.category}
              </span>
              <h3
                className="text-xl font-bold leading-tight mt-1 group-hover:text-tabloid-red transition-colors"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {featured.title}
              </h3>
              {featured.summary && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{featured.summary}</p>
              )}
              <span className="text-xs text-gray-400 mt-2 block">{featured.date}</span>
            </div>
          </motion.div>
        )}

        {/* Side grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-5">
          {sideArticles.map((article, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="cursor-pointer group"
            >
              <div className="overflow-hidden">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-[140px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-2">
                <span
                  className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
                <h4
                  className="text-sm font-bold leading-tight mt-1 group-hover:text-tabloid-red transition-colors line-clamp-2"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {article.title}
                </h4>
                <span className="text-[10px] text-gray-400 mt-1 block">{article.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      {bottomArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 pt-6 border-t border-gray-100">
          {bottomArticles.map((article, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
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
              <div className="flex flex-col justify-center min-w-0">
                <span
                  className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
                <h4
                  className="text-sm font-bold leading-tight mt-1 group-hover:text-tabloid-red transition-colors line-clamp-2"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {article.title}
                </h4>
                <span className="text-[10px] text-gray-400 mt-1">{article.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
