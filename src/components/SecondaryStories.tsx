"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { Article } from "@/data/generate-content";

interface SecondaryStoriesProps {
  stories: Article[];
}

export default function SecondaryStories({ stories }: SecondaryStoriesProps) {
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
              <span>{(story.comments || 0).toLocaleString()} comments</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
