"use client";

import { motion } from "framer-motion";
import { TrendingUp, Flame } from "lucide-react";

interface MostReadSidebarProps {
  items: { title: string; comments: number }[];
}

export default function MostReadSidebar({ items }: MostReadSidebarProps) {
  return (
    <div className="bg-white border border-tabloid-border rounded-lg overflow-hidden">
      <div className="bg-tabloid-red px-4 py-3 flex items-center gap-2">
        <Flame className="w-5 h-5 text-white" />
        <h3
          className="text-white font-bold text-lg uppercase tracking-wide"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Most Read
        </h3>
        <TrendingUp className="w-4 h-4 text-white/70 ml-auto" />
      </div>
      <div className="divide-y divide-tabloid-border">
        {items.map((item, i) => (
          <motion.a
            key={i}
            href="#"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 hover:bg-red-50 transition-colors cursor-pointer group"
          >
            <span
              className="text-2xl font-black text-tabloid-red shrink-0 w-8 text-center leading-none pt-0.5"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-tight group-hover:text-tabloid-red transition-colors line-clamp-2">
                {item.title}
              </h4>
              <span className="text-xs text-gray-400 mt-1 block">
                {item.comments.toLocaleString()} comments
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
