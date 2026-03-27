"use client";

import { SiteConfig } from "@/config/site-config";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const navLinks = ["HOME", "LOCAL NEWS", "POLITICS", "NATIONAL NEWS", "WORLD", "LIFESTYLE", "STORIES", "CONTACT"];

interface FooterProps {
  site: SiteConfig;
  footerLatest: { title: string }[];
  footerPopular: { title: string }[];
}

export default function Footer({ site, footerLatest, footerPopular }: FooterProps) {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Top bar: logo + nav */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-700/50">
        <h3
          className="text-2xl font-black tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {site.name.toUpperCase()}
        </h3>
        <nav className="flex flex-wrap items-center justify-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="px-3 py-1 text-[10px] text-gray-500 hover:text-white transition-colors font-bold tracking-wider uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {link}
            </a>
          ))}
        </nav>
      </div>

      {/* Three columns */}
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* About Us */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-tabloid-red/30"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              ABOUT US
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {site.name} is {site.state}&apos;s premier source for breaking news, politics, sports,
              entertainment, and local stories. Our dedicated team covers the stories
              that matter most to {site.state} residents.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-tabloid-red transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Latest Articles */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-tabloid-red/30"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              LATEST ARTICLES
            </h4>
            <ul className="space-y-3">
              {footerLatest.map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors flex items-start gap-2">
                    <span className="text-tabloid-red mt-1">›</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Most Popular */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-tabloid-red/30"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              MOST POPULAR
            </h4>
            <ul className="space-y-3">
              {footerPopular.map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors flex items-start gap-2">
                    <span className="text-tabloid-red mt-1">›</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="text-gray-700 text-[10px]">
            Privacy Policy &bull; Terms of Use &bull; Advertise
          </p>
        </div>
      </div>
    </footer>
  );
}
