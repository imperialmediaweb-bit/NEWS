"use client";

import { motion } from "framer-motion";
import { ChevronRight, Tag } from "lucide-react";
import { SiteConfig } from "@/config/site-config";
import { generateContent } from "@/data/generate-content";
import type { ListArticle } from "@/lib/category-data";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface TagPageClientProps {
  site: SiteConfig;
  tag: string;
  tagLabel: string;
  articles: ListArticle[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Presentation only — articles come from the server so they appear in the
 * initial HTML rather than arriving later via a client fetch a crawler may
 * never wait for.
 */
export default function TagPageClient({
  site,
  tag,
  tagLabel,
  articles,
  total,
  page,
  totalPages,
}: TagPageClientProps) {
  const content = generateContent(site);

  const makeSlug = (a: ListArticle) =>
    a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const pageHref = (n: number) => (n <= 1 ? `/tag/${tag}` : `/tag/${tag}?page=${n}`);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[var(--accent)]">Tag</span>
            <ChevronRight size={14} />
            <span className="text-white">{tagLabel}</span>
          </nav>
          <div className="flex items-center gap-3">
            <Tag size={28} className="text-[var(--accent)]" />
            <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {tagLabel}
            </h1>
          </div>
          <p className="text-gray-400 mt-2 text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {total.toLocaleString()} articles tagged with &quot;{tagLabel}&quot;
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {articles.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500 mb-8">
                No articles tagged &quot;{tagLabel}&quot; yet.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {articles.map((article, i) => {
                const cat = article.category.toLowerCase().replace(/\s+/g, "-");
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/${cat}/${makeSlug(article)}`}
                      className="group flex gap-4 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4">
                      <div className="relative w-[130px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={article.img} alt={article.title} loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase text-[var(--accent)] tracking-wider mb-1"
                          style={{ fontFamily: "'Oswald', sans-serif" }}>
                          {article.category}
                        </span>
                        <h3 className="text-sm font-bold leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2 mb-1"
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

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-3 mb-8" aria-label="Pagination">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} rel="prev"
                    className="px-5 py-2.5 bg-white border border-gray-200 rounded text-sm font-bold hover:border-[var(--accent)] transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>
                    &larr; Newer
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages.toLocaleString()}
                </span>
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} rel="next"
                    className="px-5 py-2.5 bg-[var(--accent)] text-white rounded text-sm font-bold hover:bg-[var(--accent-dark)] transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>
                    Older &rarr;
                  </Link>
                )}
              </nav>
            )}

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
                        ? "bg-[var(--accent)] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-[var(--accent)] hover:text-white"
                    }`}>
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px]">
              <Sidebar trending={articles.slice(0, 5)} newsletter={{ title: `Subscribe to ${site.name}`, description: `Get the latest ${site.city} news delivered to your inbox` }} />
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
