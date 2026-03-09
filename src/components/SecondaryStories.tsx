"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const stories = [
  {
    img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=400&fit=crop",
    badge: "News",
    title: "Grenfell families slam government over 'shameful' compensation delays",
    summary: "Survivors say promises made after the 2017 tragedy have been broken as hundreds still await payments.",
    time: "35 min ago",
    comments: 843,
  },
  {
    img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&h=400&fit=crop",
    badge: "World",
    title: "US-China tensions soar as naval standoff erupts in South China Sea",
    summary: "Pentagon confirms two warships were involved in a 'close encounter' near disputed waters.",
    time: "1 hour ago",
    comments: 1205,
  },
  {
    img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop",
    badge: "Lifestyle",
    title: "The great British pub is dying — and this tiny village is fighting back",
    summary: "Residents of a Somerset village have raised £400,000 to buy their local before developers move in.",
    time: "2 hours ago",
    comments: 567,
  },
  {
    img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop",
    badge: "Sport",
    title: "Man United in shock bid for Barcelona wonderkid as January window looms",
    summary: "Old Trafford chiefs are prepared to break the bank for the 19-year-old sensation.",
    time: "3 hours ago",
    comments: 2100,
  },
];

export default function SecondaryStories() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stories.map((story, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg mb-3">
              <img
                src={story.img}
                alt=""
                className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <Badge>{story.badge}</Badge>
              </div>
            </div>
            <h3
              className="text-lg font-bold leading-tight mb-2 group-hover:text-tabloid-red transition-colors"
              style={{ fontFamily: "'Source Serif 4', serif" }}
            >
              {story.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2 line-clamp-2">{story.summary}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {story.time}
              </span>
              <span>{story.comments.toLocaleString()} comments</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
