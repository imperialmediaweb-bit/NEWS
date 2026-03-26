"use client";

import { motion } from "framer-motion";
import { MessageSquare, ChevronRight } from "lucide-react";
import { Columnist } from "@/data/generate-content";

interface OpinionSectionProps {
  columnists: Columnist[];
}

export default function OpinionSection({ columnists }: OpinionSectionProps) {
  return (
    <section className="py-8 bg-gray-50 border-t-4 border-tabloid-red">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl md:text-3xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            <span className="text-tabloid-red">|</span> Opinion & Columnists
          </h2>
          <a
            href="#"
            className="text-tabloid-red text-sm font-bold uppercase tracking-wide hover:underline flex items-center gap-1"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            All Columns <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columnists.map((col, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer bg-white rounded-lg border border-tabloid-border p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={col.img}
                  alt={col.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-tabloid-red"
                />
                <div>
                  <h4 className="font-bold text-sm">{col.name}</h4>
                  <span className="text-xs text-tabloid-red font-semibold">{col.role}</span>
                </div>
              </div>
              <h3
                className="text-base font-bold leading-tight group-hover:text-tabloid-red transition-colors"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {col.title}
              </h3>
              <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>Join the debate</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
