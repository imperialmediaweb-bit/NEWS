"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { TrendingUp, Clock, Mail, ChevronRight } from "lucide-react";

interface SidebarProps {
  trending: Article[];
  latest: Article[];
  newsletter: { title: string; description: string };
}

export default function Sidebar({ trending, latest, newsletter }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Trending Now */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#c1121f] text-white px-4 py-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Trending Now
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {trending.map((article, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 p-3 group cursor-pointer hover:bg-red-50/50 transition-colors"
            >
              <span
                className="text-2xl font-black text-gray-200 group-hover:text-[#c1121f] transition-colors shrink-0 w-8 text-center leading-none pt-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {i + 1}
              </span>
              <div className="flex gap-2.5 flex-1 min-w-0">
                <img src={article.img} alt="" className="w-16 h-16 object-cover rounded shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {article.category}
                  </span>
                  <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-[#c1121f] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                    {article.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{article.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-[#1a1a1a] text-white rounded-lg p-5 text-center">
        <Mail className="w-8 h-8 mx-auto mb-3 text-[#c1121f]" />
        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
          {newsletter.title}
        </h3>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">{newsletter.description}</p>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-3 py-2.5 rounded text-sm bg-white/10 border border-white/20 text-white placeholder:text-gray-500 mb-2.5 focus:outline-none focus:border-[#c1121f]"
        />
        <button className="w-full bg-[#c1121f] hover:bg-[#9b111e] text-white text-sm font-bold uppercase tracking-wider py-2.5 rounded transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Subscribe Free
        </button>
      </div>

      {/* Ad Placeholder */}
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Advertisement
        </span>
        <div className="text-gray-300 text-sm mt-2">300 × 250</div>
      </div>

      {/* Latest Stories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Latest Stories
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {latest.map((article, i) => (
            <div key={i} className="flex gap-3 p-3 group cursor-pointer hover:bg-gray-50 transition-colors">
              <img src={article.img} alt="" className="w-14 h-14 object-cover rounded shrink-0" />
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-[#c1121f] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                  {article.title}
                </h4>
                <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {article.date}
                </span>
              </div>
            </div>
          ))}
        </div>
        <a href="#" className="block text-center py-3 text-[12px] font-bold uppercase tracking-wider text-[#c1121f] hover:bg-red-50 transition-colors border-t border-gray-100" style={{ fontFamily: "'Oswald', sans-serif" }}>
          View All Stories <ChevronRight className="w-3 h-3 inline" />
        </a>
      </div>
    </aside>
  );
}
