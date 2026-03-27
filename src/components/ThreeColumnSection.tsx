"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock } from "lucide-react";

interface ThreeColumnSectionProps {
  showcaseArticles: Article[];
  sportsArticles: Article[];
  editorChoice: Article[];
}

function SmallArticleList({ articles }: { articles: Article[] }) {
  return (
    <div className="space-y-4">
      {articles.map((article, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 cursor-pointer group"
        >
          <div className="relative overflow-hidden rounded shrink-0 w-[90px] h-[68px]">
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
    </div>
  );
}

export default function ThreeColumnSection({
  showcaseArticles,
  sportsArticles,
  editorChoice,
}: ThreeColumnSectionProps) {
  const featuredSport = sportsArticles[0];
  const otherSports = sportsArticles.slice(1);

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Red header bar with 3 labels */}
      <div className="grid grid-cols-1 md:grid-cols-3 shadow-md rounded-t-lg overflow-hidden">
        {[
          { label: "SHOWCASE", bg: "bg-tabloid-red" },
          { label: "SPORTS", bg: "bg-tabloid-dark-red" },
          { label: "EDITOR'S CHOICE", bg: "bg-tabloid-red" },
        ].map((tab) => (
          <div key={tab.label} className={`${tab.bg} py-3 px-4 text-center`}>
            <span
              className="text-white text-sm font-bold tracking-widest uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {tab.label}
            </span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-b-lg shadow-md p-6">
        {/* Left - Showcase */}
        <div>
          <SmallArticleList articles={showcaseArticles} />
        </div>

        {/* Center - Sports featured */}
        <div className="border-x-0 md:border-x border-gray-100 md:px-6">
          {featuredSport && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="cursor-pointer group"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={featuredSport.img}
                  alt={featuredSport.title}
                  className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span
                    className="bg-tabloid-red text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {featuredSport.category}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <h3
                  className="text-lg font-bold leading-tight group-hover:text-tabloid-red transition-colors"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                >
                  {featuredSport.title}
                </h3>
                {featuredSport.summary && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
                    {featuredSport.summary}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 mt-2 block flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {featuredSport.date}
                </span>
              </div>
            </motion.div>
          )}
          {otherSports.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <SmallArticleList articles={otherSports} />
            </div>
          )}
        </div>

        {/* Right - Editor's Choice */}
        <div>
          <SmallArticleList articles={editorChoice} />
        </div>
      </div>
    </section>
  );
}
