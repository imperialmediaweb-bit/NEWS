"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

// Nav items map to real category routes via toLowerCase + dashes.
// NOTE: no fake "breaking" ticker here — every headline shown to users
// must be a real article (AdSense misrepresentation rule).
const navItems = ["Local News", "Politics", "US News", "World News", "Sports", "Entertainment", "Business", "Web Stories"];

interface HeaderProps {
  site: SiteConfig;
}

export default function Header({ site }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* MASTHEAD — bold tabloid banner */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-4 md:py-5 flex items-center justify-between">
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex-1 text-center">
            <h1 className="inline-flex items-baseline gap-2 md:gap-3 leading-none">
              <span
                className="text-3xl md:text-5xl lg:text-6xl text-white"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {site.logoFirst}
              </span>
              <span
                className="text-3xl md:text-5xl lg:text-6xl text-[#c1121f]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {site.logoSecond}
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <span className="h-[1px] w-8 md:w-16 bg-gray-600" />
              <p className="text-[9px] md:text-[11px] text-gray-400 uppercase tracking-[0.2em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {site.tagline}
              </p>
              <span className="h-[1px] w-8 md:w-16 bg-gray-600" />
            </div>
          </div>

          {/* spacer keeps masthead centered on mobile (mirrors menu button) */}
          <span className="md:hidden w-6" />
        </div>
      </div>

      {/* Navigation — red bar, white text, tabloid feel */}
      <nav className="bg-[#c1121f]">
        <div className="max-w-[1300px] mx-auto px-4">
          <ul className="hidden md:flex items-center justify-center">
            {navItems.map((item, i) => (
              <li key={item}>
                <Link
                  href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`block px-4 lg:px-6 py-3 text-[14px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    i === 0 ? "text-white bg-[#8b0000]" : "text-white/90 hover:text-white hover:bg-[#a00f1c]"
                  }`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="md:hidden overflow-hidden bg-black border-b border-gray-800"
          >
            <ul className="py-2">
              {navItems.map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(/\s+/g, '-')}`} className="block px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:text-[#c1121f] hover:bg-gray-900 transition-colors cursor-pointer"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>{item}</Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
