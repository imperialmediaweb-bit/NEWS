"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight } from "lucide-react";

interface Article {
  img: string;
  title: string;
  summary?: string;
  time: string;
}

interface CategorySectionProps {
  title: string;
  articles: Article[];
  variant?: "default" | "alt";
}

export default function CategorySection({ title, articles, variant = "default" }: CategorySectionProps) {
  const lead = articles[0];
  const rest = articles.slice(1);
  const bgClass = variant === "alt" ? "bg-gray-50" : "bg-white";

  return (
    <section className={`${bgClass} py-8 border-t-4 border-tabloid-red`}>
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-tabloid-black"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <span className="text-tabloid-red">|</span> {title}
          </h2>
          <a
            href="#"
            className="text-tabloid-red text-sm font-bold uppercase tracking-wide hover:underline flex items-center gap-1"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            More {title} <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Lead story */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg mb-3">
              <img
                src={lead.img}
                alt=""
                className="w-full h-[250px] md:h-[350px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <Badge>{title}</Badge>
              </div>
            </div>
            <h3
              className="text-xl md:text-2xl font-bold leading-tight mb-2 group-hover:text-tabloid-red transition-colors"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              {lead.title}
            </h3>
            {lead.summary && (
              <p className="text-gray-500 text-sm leading-relaxed mb-2">{lead.summary}</p>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {lead.time}
            </span>
          </motion.article>

          {/* Side stories */}
          <div className="lg:col-span-5 space-y-4">
            {rest.map((article, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer flex gap-3"
              >
                <div className="relative overflow-hidden rounded-lg shrink-0 w-[120px] h-[85px]">
                  <img
                    src={article.img}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-bold leading-tight group-hover:text-tabloid-red transition-colors line-clamp-3"
                    style={{ fontFamily: "'Source Serif 4', serif" }}
                  >
                    {article.title}
                  </h4>
                  <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.time}
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
