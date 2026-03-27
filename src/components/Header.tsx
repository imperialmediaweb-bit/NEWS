"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, AlertTriangle } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

const navItems = ["Local News", "Politics", "US News", "World", "Sports", "Entertainment", "Scandals"];
const breakingHeadlines = [
  "BREAKING: Governor faces calls to resign",
  "Housing market in freefall — worst crash since 2008",
  "NFL BOMBSHELL: $120M trade deal CONFIRMED",
  "Shutdown looms as Congress deadlocks",
];

interface HeaderProps {
  site: SiteConfig;
}

export default function Header({ site }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Breaking news ticker — red hot */}
      <div className="bg-[#c1121f] text-white overflow-hidden">
        <div className="flex items-center">
          <div className="bg-[#8b0000] px-4 py-2 flex items-center gap-1.5 font-black text-[11px] uppercase tracking-widest shrink-0 z-10" style={{ fontFamily: "'Oswald', sans-serif" }}>
            <AlertTriangle className="w-3.5 h-3.5" /> BREAKING
          </div>
          <div className="overflow-hidden flex-1">
            <div className="animate-ticker flex whitespace-nowrap py-2">
              {[...breakingHeadlines, ...breakingHeadlines].map((h, i) => (
                <span key={i} className="mx-8 text-[12px] font-bold cursor-pointer hover:underline">{h}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MASTHEAD — bold tabloid banner */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-4 md:py-5 flex items-center justify-between">
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
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

          <Search className="w-5 h-5 text-gray-400 hover:text-[#c1121f] cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Navigation — red bar, white text, tabloid feel */}
      <nav className="bg-[#c1121f]">
        <div className="max-w-[1300px] mx-auto px-4">
          <ul className="hidden md:flex items-center justify-center">
            {navItems.map((item, i) => (
              <li key={item}>
                <a
                  href="#"
                  className={`block px-4 lg:px-6 py-3 text-[14px] font-bold uppercase tracking-wider transition-colors ${
                    i === 0 ? "text-white bg-[#8b0000]" : "text-white/90 hover:text-white hover:bg-[#a00f1c]"
                  }`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {item}
                </a>
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
                  <a href="#" className="block px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:text-[#c1121f] hover:bg-gray-900 transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>{item}</a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
