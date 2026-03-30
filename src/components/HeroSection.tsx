"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Article } from "@/data/generate-content";
import { Clock, MessageCircle, TrendingUp } from "lucide-react";

function articleHref(article: Article) {
  const categorySlug = article.category.toLowerCase().replace(/\s+/g, '-');
  const titleSlug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `/${categorySlug}/${titleSlug}`;
}

interface HeroSectionProps {
  main: Article;
  side: Article[];
}

export default function HeroSection({ main, side }: HeroSectionProps) {
  return (
    <section className="max-w-[1300px] mx-auto px-4 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAIN HERO — huge image, dramatic headline */}
        <Link href={articleHref(main)} className="lg:col-span-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden bg-black">
              <img
                src={main.img}
                alt={main.title}
                loading="eager"
                className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              {/* Category badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-[#c1121f] text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 animate-pulse"
                  style={{ fontFamily: "'Oswald', sans-serif" }}>{main.category}</span>
              </div>
              {/* HEADLINE — big, bold, tabloid */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <h2
                  className="text-white text-2xl md:text-4xl lg:text-5xl leading-[1.05] mb-3 font-black drop-shadow-xl"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {main.title}
                </h2>
                <p className="text-gray-300 text-sm md:text-base max-w-2xl mb-3 line-clamp-2 leading-relaxed hidden md:block">
                  {main.summary}
                </p>
                <div className="flex items-center gap-4 text-gray-400 text-xs">
                  <span className="font-bold text-white">{main.author}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {main.date}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 1,247 comments</span>
                </div>
              </div>
            </div>
          </motion.article>
        </Link>

        {/* SIDE STORIES — stacked, punchy */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Trending label */}
          <div className="bg-black text-white px-3 py-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#c1121f]" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>Trending Now</span>
          </div>
          {side.map((article, i) => (
            <Link key={i} href={articleHref(article)}>
              <motion.article
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * (i + 1), duration: 0.4 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden bg-black">
                  <img
                    src={article.img}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-[120px] md:h-[170px] object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-[#c1121f] text-white text-[7px] md:text-[8px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5"
                      style={{ fontFamily: "'Oswald', sans-serif" }}>{article.category}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3
                      className="text-white text-[13px] md:text-[15px] font-bold leading-snug drop-shadow-lg line-clamp-2"
                      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                    >
                      {article.title}
                    </h3>
                  </div>
                </div>
              </motion.article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
