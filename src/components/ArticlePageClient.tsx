"use client";

import { motion } from "framer-motion";
import {
  Clock,
  User,
  Share2,
  Facebook,
  Twitter,
  ChevronRight,
  Eye,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { SiteConfig } from "@/config/site-config";
import { generateContent, Article } from "@/data/generate-content";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface ArticleData {
  title: string;
  content: string;
  summary: string;
  category: string;
  author: string;
  featured_image: string;
  published_at: string;
  slug: string;
}

interface RelatedArticle {
  img: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  slug: string;
}

interface ArticlePageClientProps {
  site: SiteConfig;
  article: ArticleData | null;
  related: RelatedArticle[];
  categorySlug: string;
  slug: string;
}

export default function ArticlePageClient({ site, article, related, categorySlug, slug }: ArticlePageClientProps) {
  const content = generateContent(site);
  const categoryLabel = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const displayTitle = article?.title || categoryLabel + " — " + slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const displayImage = article?.featured_image || "";
  const displayAuthor = article?.author || "Staff Reporter";
  const displayDate = article?.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
  const displayContent = article?.content || "<p>Article not found.</p>";
  const displaySummary = article?.summary || "";

  const allMockArticles = [...content.usNews, ...content.localNews, ...content.worldNews, ...content.politics];
  const displayRelated: (RelatedArticle | Article)[] = related.length > 0 ? related : allMockArticles.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-[1300px] mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c1121f] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/${categorySlug}`} className="hover:text-[#c1121f] transition-colors">{categoryLabel}</Link>
            <ChevronRight size={14} />
            <span className="text-gray-400 line-clamp-1">{displayTitle}</span>
          </nav>
        </div>
      </div>

      {/* Hero Image */}
      {displayImage && !displayImage.includes("picsum.photos") ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-[300px] md:h-[450px] lg:h-[550px] overflow-hidden"
        >
          <img src={displayImage} alt={displayTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-[1300px] mx-auto">
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded mb-4"
                style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                {categoryLabel}
              </span>
              <h1 className="text-2xl md:text-4xl lg:text-5xl text-white leading-tight max-w-[900px]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                {displayTitle}
              </h1>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-black text-white">
          <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded mb-4"
              style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
              {categoryLabel}
            </span>
            <h1 className="text-2xl md:text-4xl lg:text-5xl text-white leading-tight max-w-[900px]"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
              {displayTitle}
            </h1>
          </div>
        </div>
      )}

      {/* Article Content + Sidebar */}
      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8"
          >
            {/* Author bar */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <Link
                      href={`/author/${displayAuthor.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      className="font-bold text-gray-900 hover:text-[#c1121f] transition-colors"
                    >
                      {displayAuthor}
                    </Link>
                    <p className="text-xs text-gray-400">{site.name}</p>
                  </div>
                </div>
                {displayDate && <div className="flex items-center gap-1 text-gray-400"><Clock size={14} /><span>{displayDate}</span></div>}
                <div className="flex items-center gap-1 text-gray-400"><BookOpen size={14} /><span>5 min read</span></div>
                <div className="flex items-center gap-1 text-gray-400"><Eye size={14} /><span>Views</span></div>
                <div className="flex items-center gap-1 text-gray-400"><MessageCircle size={14} /><span>Comments</span></div>
                <div className="ml-auto flex gap-2">
                  <button className="p-2 rounded-full bg-[#1877f2] text-white hover:opacity-80 transition-opacity"><Facebook size={16} /></button>
                  <button className="p-2 rounded-full bg-[#1da1f2] text-white hover:opacity-80 transition-opacity"><Twitter size={16} /></button>
                  <button className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"><Share2 size={16} /></button>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
              {displaySummary && (
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6 pb-6 border-b border-gray-200"
                  style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}>
                  {displaySummary}
                </p>
              )}
              <div className="article-content prose prose-lg max-w-none"
                style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: displayContent }}
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>Tags</h3>
              <div className="flex flex-wrap gap-2">
                {[categoryLabel, site.state, site.city, "Breaking News"].map((tag) => (
                  <Link key={tag} href={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-[#c1121f] hover:text-white transition-colors">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Related Articles */}
            {displayRelated.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                    Related Stories
                  </span>
                  <div className="flex-1 h-[2px] bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {displayRelated.map((rel, i) => {
                    const relSlug = rel.slug || rel.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    const relCat = rel.category.toLowerCase().replace(/\s+/g, "-");
                    const relImg = "img" in rel ? rel.img : "";
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                        <Link href={`/${relCat}/${relSlug}`} className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          {relImg && (
                            <div className="relative h-[180px] overflow-hidden">
                              <img src={relImg} alt={rel.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
                                style={{ backgroundColor: "#c1121f", fontFamily: "'Oswald', sans-serif" }}>
                                {rel.category}
                              </span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2"
                              style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>
                              {rel.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-2">{rel.date}</p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.article>

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
