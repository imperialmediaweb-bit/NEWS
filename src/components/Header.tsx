"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Menu, X } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

const categories = [
  "HOME",
  "LOCAL NEWS",
  "POLITICS",
  "NATIONAL NEWS",
  "WORLD",
  "LIFESTYLE",
  "STORIES",
  "MATERIALS",
];

interface HeaderProps {
  site: SiteConfig;
}

export default function Header({ site }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white z-50">
      {/* Top dark bar */}
      <div className="bg-[#222] text-white">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between py-2 text-xs">
          <span className="text-gray-300">{today}</span>
          <div className="flex items-center gap-1 text-gray-300">
            <a href="#" className="hover:text-white transition-colors px-2">HOME</a>
            <span className="text-gray-500">|</span>
            <a href="#" className="hover:text-white transition-colors px-2">CONTACT</a>
            <span className="text-gray-500">|</span>
            <a href="#" className="hover:text-white transition-colors px-2">MY PAGE</a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-8 flex items-center justify-center relative">
        <Mail className="w-5 h-5 text-gray-400 absolute left-4 md:relative md:left-auto md:mr-4" />
        <h1
          className="text-4xl md:text-6xl lg:text-7xl tracking-tight text-center"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
        >
          {site.name.toUpperCase()}
        </h1>
      </div>

      {/* Red navigation bar */}
      <nav className="bg-tabloid-red">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-center justify-between md:justify-center">
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <ul className="hidden md:flex items-center justify-center">
              {categories.map((cat) => (
                <li key={cat}>
                  <a
                    href="#"
                    className="block px-4 lg:px-5 py-3 text-white text-xs font-bold tracking-wider hover:bg-tabloid-dark-red transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden bg-tabloid-dark-red"
          >
            <ul className="py-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <a
                    href="#"
                    className="block px-6 py-3 text-white font-bold uppercase tracking-wide hover:bg-tabloid-red transition-colors text-sm"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
