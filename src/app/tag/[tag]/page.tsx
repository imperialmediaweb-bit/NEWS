"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Tag } from "lucide-react";
import { getActiveSite } from "@/config/sites";
import { generateContent, Article } from "@/data/generate-content";
import { useSiteDetection } from "@/hooks/useSiteDetection";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function TagPage() {
  const params = useParams();
  const tag = (params.tag as string) || "";

  const site = useSiteDetection();
  const [articles, setArticles] = useState<Article[]>([]);
  const [content, setContent] = useState(() => generateContent(getActiveSite()));

  const tagLabel = tag
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (!site) return;
    const mockContent = generateContent(site);
    setContent(mockContent);

    // Try loading from DB — search articles matching tag keyword
    fetch(`/api/tag?site=${site.slug}&tag=${tag}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
        } else {
          // Fallback to mock
          setArticles([
            ...mockContent.localNews,
            ...mockContent.usNews,
            ...mockContent.worldNews,
            ...mockContent.politics,
          ].slice(0, 12));
        }
      })
      .catch(() => {
        setArticles([
          ...mockContent.localNews,
          ...mockContent.usNews,
          ...mockContent.worldNews,
          ...mockContent.politics,
        ].slice(0, 12));
      });
  }, [site, tag]);

  const makeSlug = (a: Article) =>
    a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  if (!site) return <div className="min-h-screen bg-[#f5f5f5]" />;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* Tag Header */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#c1121f]">Tag</span>
            <ChevronRight size={14} />
            <span className="text-white">{tagLabel}</span>
          </nav>
          <div className="flex items-center gap-3">
            <Tag size={28} className="text-[#c1121f]" />
            <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {tagLabel}
            </h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {articles.length} articles tagged with &quot;{tagLabel}&quot;
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {articles.map((article, i) => {
                const cat = article.category.toLowerCase().replace(/\s+/g, "-");
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/${cat}/${makeSlug(article)}`}
                      className="group flex gap-4 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4">
                      <div className="relative w-[130px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={article.img} alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase text-[#c1121f] tracking-wider mb-1"
                          style={{ fontFamily: "'Oswald', sans-serif" }}>
                          {article.category}
                        </span>
                        <h3 className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mb-1"
                          style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>
                          {article.title}
                        </h3>
                        <div className="text-xs text-gray-400">{article.date}</div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3"
                style={{ fontFamily: "'Oswald', sans-serif" }}>Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[site.state, site.city, "Breaking News", "Politics", "Crime", "Weather",
                  "Economy", "Sports", "Education", "Health", "Real Estate", "Local Business",
                ].map((t) => (
                  <Link key={t} href={`/tag/${t.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      t.toLowerCase().replace(/\s+/g, "-") === tag
                        ? "bg-[#c1121f] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-[#c1121f] hover:text-white"
                    }`}>
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px]">
              <Sidebar trending={content.trending} latest={content.sidebarLatest} newsletter={content.sidebarNewsletter} />
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
