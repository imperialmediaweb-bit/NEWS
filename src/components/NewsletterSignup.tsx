"use client";

import { motion } from "framer-motion";
import { Mail, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsletterSignup() {
  return (
    <section className="py-10 bg-tabloid-dark-red">
      <div className="max-w-[1400px] mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2
            className="text-white text-3xl md:text-4xl font-black mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Get the Morning Headlines
          </h2>
          <p className="text-white/70 mb-6 text-sm md:text-base">
            Britain&apos;s biggest stories delivered to your inbox every morning at 6am. Free. No spam. Unsubscribe anytime.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <Button className="bg-white text-tabloid-dark-red font-bold hover:bg-gray-100 px-6 py-3 rounded-lg">
              Subscribe <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
          <p className="text-white/40 text-xs mt-4">
            By subscribing, you agree to our terms. Read our privacy policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
