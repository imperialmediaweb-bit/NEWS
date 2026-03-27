"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Mail, User, AlertTriangle } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

const navItems = ["Home", "US News", "World", "Politics", "Business", "Tech", "Sports", "Entertainment"];
const breakingHeadlines = [
  "Governor faces resignation calls as probe deepens",
  "Housing market crashes 15% — worst since 2008",
  "NFL blockbuster: $120M trade deal confirmed",
  "Congress deadlocked as shutdown looms",
  "Supreme Court takes up landmark case",
];

interface HeaderProps {
  site: SiteConfig;
}

export default function Header({ site }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Breaking news ticker */}
      <div className="bg-[#c1121f] text-white overflow-hidden">
        <div className="flex items-center">
          <div className="bg-[#9b111e] px-4 py-1.5 flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider shrink-0 z-10">
            <AlertTriangle className="w-3 h-3" /> Breaking
          </div>
          <div className="overflow-hidden flex-1">
            <div className="animate-ticker flex whitespace-nowrap py-1.5">
              {[...breakingHeadlines, ...breakingHeadlines].map((h, i) => (
                <span key={i} className="mx-6 text-[12px] font-medium cursor-pointer hover:underline">{h}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top utility bar */}
      <div className="bg-[#1a1a1a] text-gray-400 text-[11px]">
        <div className="max-w-[1300px] mx-auto px-4 py-1.5 flex justify-between items-center">
          <span>{today}</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><Mail className="w-3 h-3" /> Newsletter</a>
            <span className="text-gray-600">|</span>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1"><User className="w-3 h-3" /> Sign In</a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-[1300px] mx-auto px-4 py-6 md:py-8 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex-1 flex items-center justify-center gap-4 md:gap-6">
            <h1
              className="text-4xl md:text-6xl lg:text-[5rem] xl:text-[6rem] tracking-tight inline-block leading-none"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: "-0.04em" }}
            >
              {site.name.toUpperCase()}
            </h1>
            {/* Red dash accent — like a rushing train */}
            <span className="hidden md:block w-16 lg:w-24 h-[6px] bg-[#c1121f] rounded-full" />
          </div>
          <Search className="w-5 h-5 text-gray-500 hover:text-[#c1121f] cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b-[3px] border-[#c1121f] shadow-sm">
        <div className="max-w-[1300px] mx-auto px-4">
          <ul className="hidden md:flex items-center -mb-[3px]">
            {navItems.map((item, i) => (
              <li key={item}>
                <a
                  href="#"
                  className={`block px-4 lg:px-5 py-3 text-[13px] font-bold uppercase tracking-wide transition-colors border-b-[3px] ${
                    i === 0 ? "text-[#c1121f] border-[#c1121f]" : "text-gray-700 border-transparent hover:text-[#c1121f] hover:border-[#c1121f]"
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
            className="md:hidden overflow-hidden bg-white border-b shadow-lg"
          >
            <ul className="py-2">
              {navItems.map((item) => (
                <li key={item}>
                  <a href="#" className="block px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-[#c1121f] hover:bg-red-50 transition-colors"
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
