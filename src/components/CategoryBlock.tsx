"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock, ChevronRight } from "lucide-react";

interface CategoryBlockProps {
  title: string;
  articles: Article[];
  accent?: string;
}

export default function CategoryBlock({ title, articles, accent = "#c1121f" }: CategoryBlockProps) {
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <section className="py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 border-b-[3px] pb-2" style={{ borderColor: accent }}>
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          <span className="w-1 h-6 rounded-full" style={{ backgroundColor: accent }} />
          {title}
        </h2>
        <a href="#" className="text-[12px] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5" style={{ color: accent, fontFamily: "'Oswald', sans-serif" }}>
          See All <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lead story with big image */}
        {lead && (
          <motion.article
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-6 group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg">
              <img src={lead.img} alt={lead.title} className="w-full h-[260px] md:h-[300px] object-cover group-hover:scale-105 transition-transform duration-600" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm" style={{ backgroundColor: accent, fontFamily: "'Oswald', sans-serif" }}>{lead.category}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white text-xl font-bold leading-snug drop-shadow-md mb-1" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800 }}>{lead.title}</h3>
                {lead.summary && <p className="text-gray-200 text-sm line-clamp-2 leading-relaxed">{lead.summary}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" style={{ color: accent }} /> {lead.date}
            </div>
          </motion.article>
        )}

        {/* Side stories */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group cursor-pointer card-hover"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img src={article.img} alt={article.title} className="w-full h-[160px] object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 left-2">
                  <span className="text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: accent, fontFamily: "'Oswald', sans-serif" }}>{article.category}</span>
                </div>
              </div>
              <h4 className="mt-2 text-[14px] font-bold leading-tight group-hover:text-[#c1121f] transition-colors line-clamp-2" style={{ fontFamily: "'Source Serif 4', serif" }}>{article.title}</h4>
              <span className="text-[10px] text-gray-400 mt-1 block">{article.date}</span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
