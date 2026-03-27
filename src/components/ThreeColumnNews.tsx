"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ChevronRight } from "lucide-react";

interface ThreeColumnNewsProps {
  celebrityArticles: Article[];
  worldArticles: Article[];
  politicsArticles: Article[];
}

function NewsColumn({ title, articles }: { title: string; articles: Article[] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-tabloid-red py-3 px-4 text-center">
        <span
          className="text-white text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {title}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {articles.map((article, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`flex gap-3 cursor-pointer group pb-4 ${i < articles.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <div className="relative overflow-hidden rounded shrink-0 w-[100px] h-[75px]">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h4
                className="text-[13px] font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-2"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {article.title}
              </h4>
              <span className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {article.date}
              </span>
            </div>
          </motion.div>
        ))}
        <a href="#" className="flex items-center justify-center gap-1 text-tabloid-red text-xs font-bold uppercase tracking-wider hover:underline pt-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          More {title} <ChevronRight className="w-3 h-3" />
        </a>
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
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NewsColumn title="CELEBRITY" articles={celebrityArticles} />
        <NewsColumn title="WORLD" articles={worldArticles} />
        <NewsColumn title="POLITICS" articles={politicsArticles} />
      </div>
    </section>
  );
}
