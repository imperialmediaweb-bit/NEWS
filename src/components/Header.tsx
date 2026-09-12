"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { SiteConfig } from "@/config/site-config";

// Nav items map to real category routes via toLowerCase + dashes.
// NOTE: no fake "breaking" ticker here — every headline shown to users
// must be a real article (AdSense misrepresentation rule).
const navItems = ["Local News", "Politics", "US News", "World News", "Sports", "Entertainment", "Business", "Web Stories"];

interface HeaderProps {
  site: SiteConfig;
  /**
   * Render the masthead as the page's <h1>. Only the homepage should set this.
   * Everywhere else the <h1> belongs to the page's own subject — the article
   * headline, the category name — and a second <h1> saying "TEXAS EXPRESS"
   * just competes with it for the same slot.
   */
  asHeading?: boolean;
}

export default function Header({ site, asHeading = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Masthead = asHeading ? "h1" : "div";

  return (
    <header className="sticky top-0 z-50">
      {/* MASTHEAD — bold tabloid banner */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-4 md:py-5 flex items-center justify-between">
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          {/* Desktop counterweight for the search icon, so the masthead stays centred. */}
          <span className="hidden md:block w-6" />

          <div className="flex-1 text-center">
            <Masthead className="inline-flex items-baseline gap-2 md:gap-3 leading-none">
              <span
                className="text-3xl md:text-5xl lg:text-6xl text-white"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {site.logoFirst}
              </span>
              <span
                className="text-3xl md:text-5xl lg:text-6xl text-[var(--accent)]"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: "-0.02em" }}
              >
                {site.logoSecond}
              </span>
            </Masthead>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <span className="h-[1px] w-8 md:w-16 bg-gray-600" />
              <p className="text-[9px] md:text-[11px] text-gray-400 uppercase tracking-[0.2em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {site.tagline}
              </p>
              <span className="h-[1px] w-8 md:w-16 bg-gray-600" />
            </div>
          </div>

          {/* Links to the real /search page — never a decorative dead icon. */}
          <Link
            href="/search"
            aria-label="Search"
            className="text-white hover:text-[var(--accent)] transition-colors w-6 flex justify-end"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Navigation — red bar, white text, tabloid feel */}
      <nav className="bg-[var(--accent)]">
        <div className="max-w-[1300px] mx-auto px-4">
          <ul className="hidden md:flex items-center justify-center">
            {navItems.map((item, i) => (
              <li key={item}>
                <Link
                  href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`block px-4 lg:px-6 py-3 text-[14px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    i === 0 ? "text-white bg-[var(--accent-dark)]" : "text-white/90 hover:text-white hover:bg-[var(--accent-dark)]"
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
                  <Link href={`/${item.toLowerCase().replace(/\s+/g, '-')}`} className="block px-6 py-3 text-sm font-bold uppercase tracking-wide text-white hover:text-[var(--accent)] hover:bg-gray-900 transition-colors cursor-pointer"
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
