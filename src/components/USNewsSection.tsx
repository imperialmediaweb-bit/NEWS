"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ChevronRight } from "lucide-react";

interface USNewsSectionProps {
  articles: Article[];
}

export default function USNewsSection({ articles }: USNewsSectionProps) {
  const featured = articles[0];
  const sideArticles = articles.slice(1, 4);
  const bottomArticles = articles.slice(4);

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10">
      {/* Section header */}
      <div className="flex justify-center mb-8">
        <h2
          className="bg-tabloid-red text-white px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-md"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          US NEWS
        </h2>
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured article — big image */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="cursor-pointer group card-lift rounded-lg overflow-hidden bg-white shadow-md"
          >
            <div className="relative overflow-hidden">
              <img
                src={featured.img}
                alt={featured.title}
                className="w-full h-[340px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4">
                <span
                  className="bg-tabloid-red text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 shadow-lg"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {featured.category}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3
                  className="text-white text-xl font-bold leading-snug drop-shadow-lg mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                >
                  {featured.title}
                </h3>
                {featured.summary && (
                  <p className="text-gray-200 text-sm leading-relaxed line-clamp-2">{featured.summary}</p>
                )}
              </div>
            </div>
            <div className="px-5 py-3 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3 text-tabloid-red" />
              <span>{featured.date}</span>
              <ChevronRight className="w-3 h-3 ml-auto text-tabloid-red opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.article>
        )}

        {/* Side grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sideArticles.map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="cursor-pointer group card-lift rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <div className="relative overflow-hidden">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-[160px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="bg-tabloid-red/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4
                  className="text-sm font-bold leading-tight group-hover:text-tabloid-red transition-colors line-clamp-2"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {article.title}
                </h4>
                <span className="text-[10px] text-gray-400 mt-2 block flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {article.date}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      {bottomArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8 pt-6 border-t border-gray-200">
          {bottomArticles.map((article, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 cursor-pointer group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative overflow-hidden rounded shrink-0 w-[110px] h-[80px]">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span
                  className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {article.category}
                </span>
                <h4
                  className="text-[13px] font-bold leading-tight mt-1 group-hover:text-tabloid-red transition-colors line-clamp-2"
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
