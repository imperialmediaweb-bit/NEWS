"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface ThreeColumnNewsProps {
  celebrityArticles: Article[];
  worldArticles: Article[];
  politicsArticles: Article[];
}

function NewsColumn({ title, articles }: { title: string; articles: Article[] }) {
  return (
    <div>
      <div className="bg-tabloid-red py-2 px-4 text-center mb-4">
        <span
          className="text-white text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {title}
        </span>
      </div>
      <div className="space-y-4">
        {articles.map((article, i) => (
          <div key={i} className="flex gap-3 cursor-pointer group">
            <img
              src={article.img}
              alt={article.title}
              className="w-[80px] h-[60px] object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity"
            />
            <div className="flex flex-col justify-center min-w-0">
              <h4
                className="text-sm font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-2"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {article.title}
              </h4>
              <span className="text-[10px] text-gray-400 mt-1">{article.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThreeColumnNews({
  celebrityArticles,
  worldArticles,
  politicsArticles,
}: ThreeColumnNewsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-[1200px] mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NewsColumn title="CELEBRITY" articles={celebrityArticles} />
        <NewsColumn title="WORLD" articles={worldArticles} />
        <NewsColumn title="POLITICS" articles={politicsArticles} />
      </div>
    </motion.section>
  );
}
