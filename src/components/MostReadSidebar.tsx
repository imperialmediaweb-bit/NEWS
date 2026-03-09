"use client";

import { motion } from "framer-motion";
import { TrendingUp, Flame } from "lucide-react";

const mostRead = [
  { title: "Teacher, 34, struck off for 'inappropriate relationship' with sixth-former", comments: 4200 },
  { title: "Martin Lewis reveals the one thing every homeowner must do before April", comments: 3800 },
  { title: "Fury as council spends £2m on 'cycle lanes to nowhere' while potholes grow", comments: 3100 },
  { title: "Inside the £15m mansion where reality TV star threw 'wild' birthday bash", comments: 2900 },
  { title: "NHS GP shortage reaches crisis point as patients wait 4 weeks for appointment", comments: 2600 },
  { title: "Mum wins £50,000 payout after Tesco 'humiliated' her at checkout", comments: 2400 },
  { title: "Shocking moment road rage driver mounts pavement in school zone", comments: 2100 },
  { title: "Weather maps turn red as 'African plume' set to bring 30°C scorcher", comments: 1900 },
  { title: "Prince Harry 'blindsided' Royal Family with surprise UK visit", comments: 1800 },
  { title: "Pensioner, 82, fighting eviction after 40 years in council flat", comments: 1600 },
];

export default function MostReadSidebar() {
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
        {mostRead.map((item, i) => (
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
