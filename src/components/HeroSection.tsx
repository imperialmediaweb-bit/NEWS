"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, Share2 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 pt-6 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main hero story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8"
        >
          <article className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=700&fit=crop"
                alt="Parliament at sunset"
                className="w-full h-[300px] md:h-[450px] lg:h-[520px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-4 left-4">
                <Badge variant="breaking">BREAKING NEWS</Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <Badge className="mb-3">Politics</Badge>
                <h1
                  className="text-white text-2xl md:text-4xl lg:text-5xl leading-tight mb-3"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
                >
                  PM faces leadership crisis as 47 Tory MPs
                  submit letters of no confidence
                </h1>
                <p className="text-gray-200 text-sm md:text-base max-w-2xl mb-4 leading-relaxed">
                  Senior cabinet ministers are reported to be in emergency talks tonight as the number of
                  no-confidence letters surpasses the critical threshold, plunging Downing Street into chaos.
                </p>
                <div className="flex items-center gap-4 text-gray-300 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 12 minutes ago
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> 1,247 comments
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Share
                  </span>
                </div>
              </div>
            </div>
          </article>
        </motion.div>

        {/* Side stack stories */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {[
            {
              img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop",
              badge: "Money",
              title: "Mortgage rates to hit 7% by summer as Bank warns of 'painful correction'",
              time: "45 min ago",
            },
            {
              img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop",
              badge: "Sport",
              title: "England cricket tour in doubt after star bowler fails shock drug test",
              time: "1 hour ago",
            },
            {
              img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=600&h=400&fit=crop",
              badge: "Showbiz",
              title: "Love Island winner reveals secret wedding to Hollywood A-lister",
              time: "2 hours ago",
            },
          ].map((story, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (i + 1) }}
              className="group cursor-pointer flex gap-3 items-start"
            >
              <div className="relative overflow-hidden rounded-lg shrink-0 w-[130px] h-[90px]">
                <img
                  src={story.img}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Badge className="mb-1.5 text-[10px]">{story.badge}</Badge>
                <h3
                  className="text-sm font-bold leading-tight group-hover:text-tabloid-red transition-colors line-clamp-3"
                  style={{ fontFamily: "'Source Serif 4', serif" }}
                >
                  {story.title}
                </h3>
                <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {story.time}
                </span>
              </div>
            </motion.article>
          ))}

          {/* Ad placeholder */}
          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-[150px] mt-auto">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Advertisement</span>
          </div>
        </div>
      </div>
    </section>
  );
}
