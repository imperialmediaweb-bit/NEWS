"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Cloud,
  ThermometerSun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  "News",
  "Politics",
  "Money",
  "World",
  "Sport",
  "Showbiz",
  "Lifestyle",
  "Opinion",
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-white border-b-4 border-tabloid-red sticky top-0 z-50 shadow-md">
      {/* Top utility bar */}
      <div className="bg-tabloid-black text-white">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Sunday 9 March 2026</span>
            <span className="hidden md:flex items-center gap-1 text-gray-300">
              <Cloud className="w-3 h-3" />
              London 9°C
              <ThermometerSun className="w-3 h-3 ml-1" />
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="hover:text-tabloid-accent-red transition-colors flex items-center gap-1">
              <User className="w-3 h-3" /> Sign In
            </button>
            <span className="text-gray-500">|</span>
            <button className="hover:text-tabloid-accent-red transition-colors">Register</button>
          </div>
        </div>
      </div>

      {/* Main masthead */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex-1 flex justify-center md:justify-start">
            <div className="relative">
              <div className="flex items-center gap-0">
                <div className="bg-tabloid-red px-3 py-1 md:px-4 md:py-1.5">
                  <span
                    className="text-white text-2xl md:text-4xl lg:text-5xl tracking-tighter"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
                  >
                    THE DAILY
                  </span>
                </div>
                <div className="bg-tabloid-black px-3 py-1 md:px-4 md:py-1.5">
                  <span
                    className="text-white text-2xl md:text-4xl lg:text-5xl tracking-tighter"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
                  >
                    HERALD
                  </span>
                </div>
              </div>
              <div className="text-center mt-0.5">
                <span
                  className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Britain&apos;s Boldest Newspaper &bull; Est. 1902
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {searchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border border-tabloid-border rounded px-3 py-1.5 text-sm"
                  placeholder="Search stories..."
                  autoFocus
                />
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-tabloid-red">
        <div className="max-w-[1400px] mx-auto px-4">
          <ul className="hidden md:flex items-center">
            {categories.map((cat) => (
              <li key={cat}>
                <a
                  href="#"
                  className="block px-4 lg:px-5 py-2.5 text-white text-sm font-bold uppercase tracking-wide hover:bg-tabloid-dark-red transition-colors"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {cat}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden bg-tabloid-black"
          >
            <ul className="py-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <a
                    href="#"
                    className="block px-6 py-3 text-white font-bold uppercase tracking-wide hover:bg-tabloid-dark-red transition-colors text-sm"
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
