"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";

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
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Section header */}
      <div className="flex justify-center mb-6">
        <h2
          className="bg-tabloid-red text-white px-6 py-2 text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          LATEST POSTS
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Latest posts list (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {latestPosts.map((post, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 cursor-pointer group border-b border-gray-100 pb-5"
            >
              <img
                src={post.img}
                alt={post.title}
                className="w-[180px] h-[120px] object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity"
              />
              <div className="flex flex-col justify-center min-w-0">
                <span
                  className="bg-tabloid-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 self-start mb-2"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {post.category}
                </span>
                <h3
                  className="text-base font-bold leading-tight text-gray-900 group-hover:text-tabloid-red transition-colors line-clamp-2"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {post.title}
                </h3>
                <span className="text-[10px] text-gray-400 mt-1">{post.date}</span>
                {post.summary && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2 hidden sm:block">
                    {post.summary}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Right sidebar (1/3) */}
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-[10px] font-bold tracking-wider text-center transition-colors ${
                  activeTab === tab.key
                    ? "bg-tabloid-red text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="pt-4 space-y-4">
            {tabContent[activeTab].map((article, i) => (
              <motion.div
                key={`${activeTab}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 cursor-pointer group"
              >
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-[70px] h-[55px] object-cover flex-shrink-0 group-hover:opacity-80 transition-opacity"
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
