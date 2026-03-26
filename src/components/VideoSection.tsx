"use client";

import { motion } from "framer-motion";
import { Play, Clock } from "lucide-react";
import { VideoItem } from "@/data/generate-content";

interface VideoSectionProps {
  videos: VideoItem[];
}

export default function VideoSection({ videos }: VideoSectionProps) {
  return (
    <section className="py-8 bg-white border-t-4 border-tabloid-red">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-tabloid-red fill-tabloid-red" />
            <h2
              className="text-2xl md:text-3xl font-black uppercase tracking-tight"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              <span className="text-tabloid-red">|</span> Video & Analysis
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.map((video, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg mb-3">
                <img
                  src={video.img}
                  alt=""
                  className="w-full h-[180px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-tabloid-red/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-bold">
                  {video.duration}
                </div>
              </div>
              <h3
                className="text-sm font-bold leading-tight group-hover:text-tabloid-red transition-colors"
                style={{ fontFamily: "'Source Serif 4', serif" }}
              >
                {video.title}
              </h3>
              <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {video.time}
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
