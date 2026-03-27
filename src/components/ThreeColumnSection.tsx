"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

interface ThreeColumnSectionProps {
  showcaseArticles: Article[];
  sportsArticles: Article[];
  editorChoice: Article[];
}

function SmallArticleList({ articles }: { articles: Article[] }) {
  return (
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-[1200px] mx-auto px-4 py-8"
    >
      {/* Red header bar with 3 labels */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="bg-tabloid-red py-2 px-4 text-center">
          <span
            className="text-white text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            SHOWCASE
          </span>
        </div>
        <div className="bg-tabloid-dark-red py-2 px-4 text-center">
          <span
            className="text-white text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            SPORTS
          </span>
        </div>
        <div className="bg-tabloid-red py-2 px-4 text-center">
          <span
            className="text-white text-sm font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            EDITOR&apos;S CHOICE
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Left - Showcase */}
        <div>
          <SmallArticleList articles={showcaseArticles} />
        </div>

        {/* Center - Sports featured */}
        <div>
          {featuredSport && (
            <div className="cursor-pointer group">
              <div className="relative overflow-hidden">
                <img
                  src={featuredSport.img}
                  alt={featuredSport.title}
                  className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-3">
                <span
                  className="text-tabloid-red text-[10px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {featuredSport.category}
                </span>
                <h3
                  className="text-lg font-bold leading-tight mt-1 group-hover:text-tabloid-red transition-colors"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {featuredSport.title}
                </h3>
                {featuredSport.summary && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {featuredSport.summary}
                  </p>
                )}
                <span className="text-[10px] text-gray-400 mt-2 block">{featuredSport.date}</span>
              </div>
            </div>
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
    </motion.section>
  );
}
