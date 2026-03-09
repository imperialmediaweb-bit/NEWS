"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, Lock } from "lucide-react";

const exclusives = [
  {
    img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800&h=500&fit=crop",
    title: "EXCLUSIVE: Inside the secretive private members' club where Cabinet ministers make backroom deals",
    summary: "A Daily Herald investigation reveals the Mayfair establishment where political power brokers gather away from public scrutiny.",
    time: "4 hours ago",
    tag: "Investigation",
  },
  {
    img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&h=400&fit=crop",
    title: "REVEALED: Defence chiefs covered up scale of cyber attacks on UK military systems",
    summary: "Leaked documents show hundreds of attempted breaches were kept from Parliament.",
    time: "6 hours ago",
    tag: "Exclusive",
  },
  {
    img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop",
    title: "The hidden landlords: How anonymous shell companies own 50,000 UK homes",
    summary: "Our data investigation tracks the offshore ownership trail behind Britain's housing crisis.",
    time: "8 hours ago",
    tag: "Data Investigation",
  },
];

export default function ExclusivesSection() {
  return (
    <section className="bg-tabloid-black py-10">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-tabloid-accent-red" />
          <h2
            className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Exclusives & Investigations
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {exclusives.map((item, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg mb-3">
                <img
                  src={item.img}
                  alt=""
                  className={`w-full ${i === 0 ? "h-[280px]" : "h-[200px]"} object-cover group-hover:scale-105 transition-transform duration-500`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="exclusive">{item.tag}</Badge>
                </div>
              </div>
              <h3
                className="text-lg font-bold leading-tight text-white mb-2 group-hover:text-tabloid-accent-red transition-colors"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-2 line-clamp-2">{item.summary}</p>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {item.time}
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
