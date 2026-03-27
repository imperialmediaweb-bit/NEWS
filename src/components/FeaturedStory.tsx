"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ArrowRight } from "lucide-react";

interface FeaturedStoryProps {
  article: Article;
}

export default function FeaturedStory({ article }: FeaturedStoryProps) {
  return (
    <section className="py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-xl cursor-pointer group"
      >
        <img
          src={article.img}
          alt={article.title}
          className="w-full h-[350px] md:h-[450px] lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Badge */}
        <div className="absolute top-5 left-5">
          <span
            className="bg-[#c1121f] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-lg"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {article.category}
          </span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <h2
            className="text-white text-2xl md:text-4xl lg:text-5xl font-black leading-[1.05] mb-4 max-w-4xl drop-shadow-lg"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-gray-200 text-sm md:text-base max-w-2xl mb-4 line-clamp-3 leading-relaxed">
              {article.summary}
            </p>
          )}
          <div className="flex items-center gap-4 text-gray-300 text-xs">
            {article.author && <span className="font-semibold text-white">{article.author}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.date}</span>
            <span className="flex items-center gap-1 text-[#c1121f] font-bold uppercase tracking-wider group-hover:underline">
              Read Full Story <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
