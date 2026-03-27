"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, MessageCircle } from "lucide-react";

interface HeroSectionProps {
  main: Article;
  side: Article[];
}

export default function HeroSection({ main, side }: HeroSectionProps) {
  return (
    <section className="max-w-[1300px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main hero story */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8 group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={main.img}
              alt={main.title}
              className="w-full h-[400px] md:h-[550px] lg:h-[650px] object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            {/* Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-[#c1121f] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-lg animate-pulse"
                style={{ fontFamily: "'Oswald', sans-serif" }}>{main.category}</span>
            </div>
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
              <h2
                className="text-white text-2xl md:text-4xl lg:text-[2.75rem] leading-[1.1] mb-3 font-black drop-shadow-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {main.title}
              </h2>
              <p className="text-gray-200 text-sm md:text-base max-w-2xl mb-3 line-clamp-2 leading-relaxed">
                {main.summary}
              </p>
              <div className="flex items-center gap-4 text-gray-300 text-xs">
                <span className="font-semibold text-white">{main.author}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {main.date}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 1,247</span>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Side stories */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-4">
          {side.map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * (i + 1), duration: 0.4 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-[205px] object-cover group-hover:scale-110 transition-transform duration-600"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#c1121f] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>{article.category}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3
                    className="text-white text-[15px] font-bold leading-snug drop-shadow-md line-clamp-2"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}
                  >
                    {article.title}
                  </h3>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
