"use client";

import { motion } from "framer-motion";

export default function PromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-tabloid-red"
    >
      <div className="max-w-[1200px] mx-auto px-4 py-3 text-center">
        <span className="text-white text-sm font-bold tracking-wide">
          Promote your business. Contact us!
        </span>
      </div>
    </motion.div>
  );
}
