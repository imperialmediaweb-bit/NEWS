"use client";

import { motion } from "framer-motion";
import { SiteConfig } from "@/config/site-config";
import { generateContent, Article } from "@/data/generate-content";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CategoryPageClientProps {
  site: SiteConfig;
  categorySlug: string;
  categoryLabel: string;
}

export default function CategoryPageClient({ site, categorySlug, categoryLabel }: CategoryPageClientProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [content, setContent] = useState(() => generateContent(site));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  function loadArticles(pageNum: number, append = false) {
    setLoading(true);
    fetch(`/api/category?site=${site.slug}&category=${categorySlug}&page=${pageNum}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles && data.articles.length > 0) {
          setArticles((prev) => append ? [...prev, ...data.articles] : data.articles);
          setTotalPages(data.totalPages || 1);
          setPage(pageNum);
        } else if (!append) {
          const mockContent = generateContent(site);
          const categoryMap: Record<string, Article[]> = {
            "local-news": mockContent.localNews,
            "us-news": mockContent.usNews,
            "world-news": mockContent.worldNews,
            politics: mockContent.politics,
            sports: mockContent.sports,
            entertainment: mockContent.entertainment,
            business: mockContent.business,
            technology: mockContent.technology,
            opinion: mockContent.opinion,
            celebrity: mockContent.celebrity,
          };
          setArticles(categoryMap[categorySlug] || mockContent.usNews);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!append) {
          const mockContent = generateContent(site);
          const categoryMap: Record<string, Article[]> = {
            "local-news": mockContent.localNews,
            "us-news": mockContent.usNews,
            "world-news": mockContent.worldNews,
            politics: mockContent.politics,
            sports: mockContent.sports,
            entertainment: mockContent.entertainment,
            business: mockContent.business,
            technology: mockContent.technology,
            opinion: mockContent.opinion,
            celebrity: mockContent.celebrity,
          };
          setArticles(categoryMap[categorySlug] || mockContent.usNews);
        }
        setLoading(false);
      });
  }

  useEffect(() => {
    const mockContent = generateContent(site);
    setContent(mockContent);
    loadArticles(1);
  }, [site, categorySlug]);

  const leadArticle = articles[0];
  const gridArticles = articles.slice(1, 7);
  const listArticles = articles.slice(7);

  const makeSlug = (a: Article) =>
    a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* Category Hero Banner */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-gray-600">&rsaquo;</span>
            <span className="text-[#c1121f]">{categoryLabel}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            {categoryLabel}
          </h1>
          <p className="text-gray-400 mt-2 text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Latest {categoryLabel.toLowerCase()} from {site.city}, {site.state} and beyond
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {leadArticle && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                <Link href={`/${categorySlug}/${makeSlug(leadArticle)}`}
                  className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7 relative h-[280px] lg:h-[380px] overflow-hidden">
                      <img src={leadArticle.img} alt={leadArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <span className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded"
                        style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                        {leadArticle.category}
                      </span>
                    </div>
                    <div className="lg:col-span-5 p-6 flex flex-col justify-center">
                      <h2 className="text-xl lg:text-2xl leading-tight group-hover:text-[#c1121f] transition-colors mb-4"
                        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                        {leadArticle.title}
                      </h2>
                      {leadArticle.summary && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{leadArticle.summary}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{leadArticle.author || "Staff Reporter"}</span>
                        <span>&bull;</span>
                        <span>{leadArticle.date}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            <div className="flex items-center gap-3 mb-5">
              <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                Latest
              </span>
              <div className="flex-1 h-[2px] bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {gridArticles.map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={`/${categorySlug}/${makeSlug(article)}`}
                    className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full">
                    <div className="relative h-[200px] overflow-hidden">
                      <img src={article.img} alt={article.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
                        style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                        {article.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mb-2"
                        style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{article.author || "Staff Reporter"}</span>
                        <span>&bull;</span>
                        <span>{article.date}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {listArticles.length > 0 && (
              <div className="space-y-4">
                {listArticles.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/${categorySlug}/${makeSlug(article)}`}
                      className="group flex gap-4 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4">
                      <div className="relative w-[160px] h-[110px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={article.img} alt={article.title} loading="lazy"
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
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{article.author || "Staff Reporter"}</span>
                          <span>&bull;</span>
                          <span>{article.date}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
            {/* Load More Button */}
            {page < totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={() => loadArticles(page + 1, true)}
                  disabled={loading}
                  className="px-8 py-3 bg-[#c1121f] text-white font-bold rounded-lg hover:bg-[#9b111e] transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "1px", textTransform: "uppercase" }}
                >
                  {loading ? "Loading..." : "Load More Articles"}
                </button>
              </div>
            )}
          </div>

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
