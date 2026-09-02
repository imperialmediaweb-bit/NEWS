"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Article } from "@/data/generate-content";

function articleHref(article: Article) {
  const categorySlug = (article.category || "news").toLowerCase().replace(/\s+/g, '-');
  // Prefer the real DB slug — rebuilding from the title 404s when they differ.
  const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `/${categorySlug}/${slug}`;
}

interface PopularSectionProps {
  articles: Article[];
}

export default function PopularSection({ articles }: PopularSectionProps) {
  return (
    <section className="py-6">
      {/* Red bar header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[var(--accent)] text-white px-4 py-2">
          <h2 className="text-sm md:text-base font-black uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Popular
          </h2>
        </div>
        <span className="flex-1 h-[3px] bg-gray-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {articles.slice(0, 6).map((article, i) => (
          <Link key={i} href={articleHref(article)}>
            <motion.article
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img
                  src={article.img}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-[120px] md:h-[150px] object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-1.5 left-1.5">
                  <span className="bg-[var(--accent)] text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {article.category}
                  </span>
                </div>
              </div>
              <h4 className="mt-1.5 text-[11px] md:text-[12px] font-bold leading-tight group-hover:text-[var(--accent)] transition-colors line-clamp-3" style={{ fontFamily: "'Source Serif 4', serif" }}>
                {article.title}
              </h4>
            </motion.article>
          </Link>
        ))}
      </div>
    </section>
  );
}
