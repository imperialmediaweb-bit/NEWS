"use client";

import { useParams } from "next/navigation";
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
import { getActiveSite } from "@/config/sites";
import { generateContent, Article } from "@/data/generate-content";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Link from "next/link";

const site = getActiveSite();
const content = generateContent(site);

// Gather all articles for "related"
const allArticles: Article[] = [
  ...content.usNews,
  ...content.localNews,
  ...content.worldNews,
  ...content.politics,
  ...content.sports,
  ...content.entertainment,
  ...content.business,
  ...content.technology,
  ...content.opinion,
];

export default function ArticlePage() {
  const params = useParams();
  const category = (params.category as string) || "";
  const slug = (params.slug as string) || "";

  // Find article by slug (mock — match by title converted to slug)
  const article = allArticles.find(
    (a) =>
      a.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") === slug
  ) || allArticles[0];

  const categoryLabel = category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Related articles from same category
  const related = allArticles
    .filter((a) => a.category.toLowerCase().replace(/\s+/g, "-") === category && a.title !== article.title)
    .slice(0, 3);

  // Mock full article content
  const articleBody = `
    <p>${article.summary || `A major story is developing in ${site.city}, ${site.state} that has caught the attention of residents and officials alike.`}</p>
    <p>Local authorities confirmed the details early this morning, sending shockwaves through the community. Sources close to the matter say this could have far-reaching implications for the region.</p>
    <p>"This is something we've been monitoring closely," said a spokesperson for the ${site.city} city government. "We want to assure residents that we are taking every necessary step to address the situation."</p>
    <h2>What We Know So Far</h2>
    <p>The incident first came to light when multiple reports surfaced on social media, prompting an immediate response from local law enforcement. Within hours, the story had gained national attention.</p>
    <p>Experts in the field have weighed in, offering a range of perspectives on how this might unfold in the coming days and weeks. Many point to similar events in other states as potential precedents.</p>
    <blockquote>"This is unprecedented in the history of ${site.state}. We haven't seen anything like this in decades."</blockquote>
    <p>Community leaders have organized a series of town hall meetings to discuss the implications and gather public input. The first session is scheduled for next week at the ${site.city} Community Center.</p>
    <h2>Impact on the Community</h2>
    <p>Residents have expressed a mix of concern and cautious optimism. Local businesses report that foot traffic has remained steady, though some have noted increased interest from out-of-state visitors following the news coverage.</p>
    <p>The ${site.name} will continue to provide updates as this story develops. Check back for the latest information and analysis from our team of reporters on the ground.</p>
    <p>Anyone with additional information is encouraged to contact the ${site.city} tip line. All tips can remain anonymous.</p>
  `;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-[1300px] mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#c1121f] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`/${category}`}
              className="hover:text-[#c1121f] transition-colors"
            >
              {categoryLabel}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-400 line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-[300px] md:h-[450px] lg:h-[550px] overflow-hidden"
      >
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-[1300px] mx-auto">
            <span
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded mb-4"
              style={{
                backgroundColor: "#c1121f",
                fontFamily: "'Oswald', sans-serif",
              }}
            >
              {categoryLabel}
            </span>
            <h1
              className="text-2xl md:text-4xl lg:text-5xl text-white leading-tight max-w-[900px]"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
              }}
            >
              {article.title}
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Article Content + Sidebar */}
      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8"
          >
            {/* Author / Meta bar */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {article.author || "Staff Reporter"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {site.name} Correspondent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <BookOpen size={14} />
                  <span>5 min read</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye size={14} />
                  <span>2,847 views</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <MessageCircle size={14} />
                  <span>34 comments</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <button className="p-2 rounded-full bg-[#1877f2] text-white hover:opacity-80 transition-opacity">
                    <Facebook size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-[#1da1f2] text-white hover:opacity-80 transition-opacity">
                    <Twitter size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
              {article.summary && (
                <p
                  className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6 pb-6 border-b border-gray-200"
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontWeight: 600,
                  }}
                >
                  {article.summary}
                </p>
              )}
              <div
                className="article-content prose prose-lg max-w-none"
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: articleBody }}
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h3
                className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {[categoryLabel, site.state, site.city, "Breaking News", "2026"].map(
                  (tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-[#c1121f] hover:text-white transition-colors"
                    >
                      {tag}
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* Related Articles */}
            {related.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"
                    style={{
                      backgroundColor: "#c1121f",
                      fontFamily: "'Oswald', sans-serif",
                    }}
                  >
                    Related Stories
                  </span>
                  <div className="flex-1 h-[2px] bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {related.map((rel, i) => {
                    const relSlug = rel.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    const relCat = rel.category
                      .toLowerCase()
                      .replace(/\s+/g, "-");
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Link
                          href={`/${relCat}/${relSlug}`}
                          className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="relative h-[180px] overflow-hidden">
                            <img
                              src={rel.img}
                              alt={rel.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span
                              className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
                              style={{
                                backgroundColor: "#c1121f",
                                fontFamily: "'Oswald', sans-serif",
                              }}
                            >
                              {rel.category}
                            </span>
                          </div>
                          <div className="p-4">
                            <h3
                              className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2"
                              style={{
                                fontFamily: "'Source Serif 4', serif",
                                fontWeight: 700,
                              }}
                            >
                              {rel.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-2">
                              {rel.date}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.article>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px]">
              <Sidebar
                trending={content.trending}
                latest={content.sidebarLatest}
                newsletter={content.sidebarNewsletter}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
