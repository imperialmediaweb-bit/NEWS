"use client";

import { motion } from "framer-motion";
import { Article } from "@/data/generate-content";
import { Clock } from "lucide-react";

interface CategoryBlockProps {
  title: string;
  articles: Article[];
  accent?: string;
  layout?: "grid3" | "lead-side" | "list";
}

export default function CategoryBlock({ title, articles, accent = "#c1121f", layout = "grid3" }: CategoryBlockProps) {
  if (layout === "list") {
    return <ListLayout title={title} articles={articles} accent={accent} />;
  }
  if (layout === "lead-side") {
    return <LeadSideLayout title={title} articles={articles} accent={accent} />;
  }
  return <Grid3Layout title={title} articles={articles} accent={accent} />;
}

/* 3-column equal grid (like Alaska Express Local News) */
function Grid3Layout({ title, articles, accent }: { title: string; articles: Article[]; accent: string }) {
  return (
    <section className="py-6">
      {/* Red bar section header */}
      <div className="text-white text-center py-3 mb-6" style={{ backgroundColor: accent }}>
        <h2 className="text-base md:text-lg font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.slice(0, 3).map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img
                src={article.img}
                alt={article.title}
                className="w-full h-[340px] md:h-[420px] object-cover group-hover:scale-105 transition-transform duration-600"
              />
              <div className="absolute top-3 left-3">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg" style={{ backgroundColor: accent, fontFamily: "'Oswald', sans-serif" }}>
                  {article.category}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3">
                <h3 className="text-[15px] font-bold leading-snug text-black line-clamp-3" style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>
                  {article.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" style={{ color: accent }} /> {article.date}
            </div>
          </motion.article>
        ))}
      </div>

      {/* Extra articles as small row below */}
      {articles.length > 3 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {articles.slice(3).map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img src={article.img} alt={article.title} className="w-full h-[200px] object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h4 className="mt-2 text-[13px] font-bold leading-tight group-hover:text-[#c1121f] transition-colors line-clamp-2" style={{ fontFamily: "'Source Serif 4', serif" }}>
                {article.title}
              </h4>
              <span className="text-[10px] text-gray-400 mt-0.5 block">{article.date}</span>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}

/* Lead article left + smaller articles right (like Alaska Express Showcase) */
function LeadSideLayout({ title, articles, accent }: { title: string; articles: Article[]; accent: string }) {
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <section className="py-6">
      <div className="text-white text-center py-3 mb-6" style={{ backgroundColor: accent }}>
        <h2 className="text-base md:text-lg font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {lead && (
          <motion.article
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 group cursor-pointer"
          >
            <div className="relative overflow-hidden">
              <img src={lead.img} alt={lead.title} className="w-full h-[350px] md:h-[450px] object-cover group-hover:scale-105 transition-transform duration-600" />
              <div className="absolute top-3 left-3">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 shadow-lg" style={{ backgroundColor: accent, fontFamily: "'Oswald', sans-serif" }}>{lead.category}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <h3 className="text-white text-xl md:text-2xl font-bold leading-snug drop-shadow-md mb-1" style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>{lead.title}</h3>
                {lead.summary && <p className="text-gray-200 text-sm line-clamp-2 leading-relaxed">{lead.summary}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" style={{ color: accent }} /> {lead.date}
            </div>
          </motion.article>
        )}

        <div className="lg:col-span-5 space-y-4">
          {rest.map((article, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 group cursor-pointer"
            >
              <img src={article.img} alt={article.title} className="w-[140px] h-[100px] object-cover shrink-0 group-hover:opacity-90 transition-opacity" />
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accent, fontFamily: "'Oswald', sans-serif" }}>{article.category}</span>
                <h4 className="text-[14px] font-bold leading-tight group-hover:text-[#c1121f] transition-colors line-clamp-2 mt-0.5" style={{ fontFamily: "'Source Serif 4', serif" }}>{article.title}</h4>
                <span className="text-[10px] text-gray-400 mt-1 block">{article.date}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* List layout with image + title + summary (like Alaska Express Latest Posts) */
function ListLayout({ title, articles, accent }: { title: string; articles: Article[]; accent: string }) {
  return (
    <section className="py-6">
      <div className="text-white text-center py-3 mb-6" style={{ backgroundColor: accent }}>
        <h2 className="text-base md:text-lg font-bold uppercase tracking-widest italic" style={{ fontFamily: "'Oswald', sans-serif" }}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
        {articles.map((article, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-4 group cursor-pointer pb-5 border-b border-gray-200"
          >
            <img src={article.img} alt={article.title} className="w-[160px] h-[115px] object-cover shrink-0 group-hover:opacity-90 transition-opacity" />
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accent, fontFamily: "'Oswald', sans-serif" }}>{article.category}</span>
              <h4 className="text-[17px] font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mt-0.5" style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 700 }}>
                {article.title}
              </h4>
              {article.summary && <p className="text-gray-500 text-[13px] line-clamp-2 mt-1 leading-relaxed">{article.summary}</p>}
              <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {article.date}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
