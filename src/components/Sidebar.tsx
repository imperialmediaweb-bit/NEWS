"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Article } from "@/data/generate-content";
import { TrendingUp, Clock, Mail, ChevronRight } from "lucide-react";

function articleHref(article: Article) {
  const categorySlug = (article.category || "news").toLowerCase().replace(/\s+/g, '-');
  // Always prefer the real DB slug — rebuilding it from the title 404s
  // whenever the stored slug differs (truncation, edited titles, imports).
  const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `/${categorySlug}/${slug}`;
}

interface SidebarProps {
  trending?: Article[];
  latest?: Article[];
  newsletter?: { title: string; description: string };
}

export default function Sidebar({ trending = [], latest = [], newsletter }: SidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Trending Now */}
      {trending.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[var(--accent)] text-white px-4 py-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Trending Now
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {trending.map((article, i) => (
              <Link key={i} href={articleHref(article)}>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 p-3 group cursor-pointer hover:bg-red-50/50 transition-colors"
                >
                  <span
                    className="text-2xl font-black text-gray-200 group-hover:text-[var(--accent)] transition-colors shrink-0 w-8 text-center leading-none pt-1"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex gap-2.5 flex-1 min-w-0">
                    <img src={article.img} alt="" loading="lazy" className="w-16 h-16 object-cover rounded shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                        {article.category}
                      </span>
                      <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                        {article.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">{article.date}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter — links to the working contact form (no dead inputs) */}
      {newsletter && (
        <div className="bg-[#1a1a1a] text-white rounded-lg p-5 text-center">
          <Mail className="w-8 h-8 mx-auto mb-3 text-[var(--accent)]" />
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {newsletter.title}
          </h3>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">{newsletter.description}</p>
          <Link
            href="/contact"
            className="block w-full bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white text-sm font-bold uppercase tracking-wider py-2.5 rounded transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Get in Touch
          </Link>
        </div>
      )}

      {/* Latest Stories */}
      {latest.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a1a] text-white px-4 py-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Latest Stories
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {latest.map((article, i) => (
              <Link key={i} href={articleHref(article)}>
                <div className="flex gap-3 p-3 group cursor-pointer hover:bg-gray-50 transition-colors">
                  <img src={article.img} alt="" loading="lazy" className="w-14 h-14 object-cover rounded shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: "'Source Serif 4', serif" }}>
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {article.date}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/local-news" className="block text-center py-3 text-[12px] font-bold uppercase tracking-wider text-[var(--accent)] hover:bg-red-50 transition-colors border-t border-gray-100" style={{ fontFamily: "'Oswald', sans-serif" }}>
            View All Stories <ChevronRight className="w-3 h-3 inline" />
          </Link>
        </div>
      )}
    </aside>
  );
}
