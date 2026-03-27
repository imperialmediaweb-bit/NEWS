"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ChevronRight } from "lucide-react";

interface LatestPostsSectionProps {
  latestPosts: Article[];
  sidebarNew: Article[];
  sidebarTech: Article[];
  sidebarLifestyle: Article[];
}

export default function LatestPostsSection({
  latestPosts,
  sidebarNew,
  sidebarTech,
  sidebarLifestyle,
}: LatestPostsSectionProps) {
  const [activeTab, setActiveTab] = useState<"new" | "tech" | "lifestyle">("new");

  const tabs = [
    { key: "new" as const, label: "NEW AND HOT" },
    { key: "tech" as const, label: "TECHNOLOGY" },
    { key: "lifestyle" as const, label: "LIFESTYLE" },
  ];

  const tabContent = {
    new: sidebarNew,
    tech: sidebarTech,
    lifestyle: sidebarLifestyle,
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-10">
      {/* Section header */}
      <div className="flex justify-center mb-8">
        <h2
          className="bg-tabloid-red text-white px-8 py-2.5 text-sm font-bold tracking-widest uppercase shadow-md"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LATEST POSTS
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Latest posts list (2/3) */}
        <div className="lg:col-span-2 space-y-0">
          {latestPosts.map((post, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-5 cursor-pointer group py-5 border-b border-gray-200 hover:bg-white/80 transition-colors px-3 -mx-3 rounded-lg"
            >
              <div className="relative overflow-hidden rounded-lg shrink-0 w-[200px] h-[140px] shadow-sm">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2">
                  <span
                    className="bg-tabloid-red text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-md"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h3
                  className="text-base md:text-lg font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-2"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                >
                  {post.title}
                </h3>
                <span className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-tabloid-red" /> {post.date}
                </span>
                {post.summary && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2 hidden sm:block">
                    {post.summary}
                  </p>
                )}
                <span className="text-tabloid-red text-xs font-bold mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  READ MORE <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Right sidebar (1/3) */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-fit">
          {/* Tabs */}
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-[10px] font-bold tracking-wider text-center transition-all ${
                  activeTab === tab.key
                    ? "bg-tabloid-red text-white shadow-inner"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                }`}
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 space-y-4">
            {tabContent[activeTab].map((article, i) => (
              <motion.div
                key={`${activeTab}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-3 cursor-pointer group pb-4 ${i < tabContent[activeTab].length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="relative overflow-hidden rounded shrink-0 w-[75px] h-[58px]">
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
                  <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {article.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
