"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Mail, AlignJustify } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

const navItems = ["Local News", "Politics", "National News", "World", "Lifestyle", "Sports", "Scandals"];

interface HeaderProps {
  site: SiteConfig;
}

export default function Header({ site }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top utility bar */}
      <div className="bg-white border-b border-gray-200 text-[11px]">
        <div className="max-w-[1300px] mx-auto px-4 py-1.5 flex justify-between items-center">
          <span className="text-gray-500">{today}</span>
          <div className="hidden md:flex items-center gap-4 text-gray-600">
            <a href="#" className="hover:text-black transition-colors font-semibold uppercase tracking-wider">About</a>
            <a href="#" className="hover:text-black transition-colors font-semibold uppercase tracking-wider">Contact</a>
            <a href="#" className="text-[#c1121f] font-bold uppercase tracking-wider hover:underline">| My Account |</a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-white">
        <div className="max-w-[1300px] mx-auto px-4 py-5 md:py-7 flex items-center justify-between">
          {/* Newsletter icon - left */}
          <div className="hidden md:flex flex-col items-center gap-1 cursor-pointer group">
            <Mail className="w-6 h-6 text-gray-700 group-hover:text-[#c1121f] transition-colors" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-700" style={{ fontFamily: "'Oswald', sans-serif" }}>Newsletter</span>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo centered */}
          <div className="flex-1 text-center">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl inline-block leading-none"
              style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, letterSpacing: "0.02em" }}
            >
              {site.name.toUpperCase()}
            </h1>
            <p className="text-[11px] md:text-[13px] text-gray-500 mt-1 italic" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              &ldquo;{site.tagline}&rdquo;
            </p>
          </div>

          {/* Pricing Plans - right */}
          <a href="#" className="hidden md:block border-2 border-black px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Pricing Plans
          </a>

          <Search className="md:hidden w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-t border-b border-gray-200">
        <div className="max-w-[1300px] mx-auto px-4">
          <ul className="hidden md:flex items-center justify-center">
            {/* ALL button */}
            <li>
              <a
                href="#"
                className="flex items-center gap-1.5 bg-[#c1121f] text-white px-4 py-3 text-[13px] font-bold uppercase tracking-wider hover:bg-[#9b111e] transition-colors"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                <AlignJustify className="w-4 h-4" /> ALL
              </a>
            </li>
            {navItems.map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="block px-4 lg:px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-gray-800 hover:text-[#c1121f] transition-colors"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {item}
                </a>
              </li>
            ))}
            <li className="ml-auto">
              <Search className="w-5 h-5 text-gray-600 hover:text-[#c1121f] cursor-pointer transition-colors" />
            </li>
          </ul>
        </div>
      </nav>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white text-center py-4">
        <p className="text-base md:text-lg font-medium">
          Promote your business. <a href="#" className="font-bold hover:underline">Contact us!</a>
        </p>
      </div>

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
