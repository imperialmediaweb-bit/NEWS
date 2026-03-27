"use client";

import { SiteConfig } from "@/config/site-config";

const navLinks = ["HOME", "LOCAL NEWS", "POLITICS", "NATIONAL NEWS", "WORLD", "LIFESTYLE", "STORIES", "CONTACT"];

interface FooterProps {
  site: SiteConfig;
  footerLatest: { title: string }[];
  footerPopular: { title: string }[];
}

export default function Footer({ site, footerLatest, footerPopular }: FooterProps) {
  return (
    <footer className="bg-[#222] text-white">
      {/* Top bar: logo + nav */}
      <div className="max-w-[1200px] mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-700">
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
              className="px-3 py-1 text-[10px] text-gray-400 hover:text-white transition-colors font-bold tracking-wider uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {link}
            </a>
          ))}
        </nav>
      </div>

      {/* Three columns */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Us */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              ABOUT US
            </h4>
            <p className="text-gray-400 text-sm leading-relaxed">
              {site.name} is {site.state}&apos;s premier source for breaking news, politics, sports,
              entertainment, and local stories. Our team of dedicated journalists covers the stories
              that matter most to {site.state} residents, delivering accurate and timely reporting
              you can count on. Stay informed with {site.name}.
            </p>
          </div>

          {/* Latest Articles */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              LATEST ARTICLES
            </h4>
            <ul className="space-y-2">
              {footerLatest.map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Most Popular */}
          <div>
            <h4
              className="text-tabloid-red font-bold text-sm uppercase tracking-wider mb-4"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              MOST POPULAR
            </h4>
            <ul className="space-y-2">
              {footerPopular.map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-[1200px] mx-auto px-4 py-4 text-center">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
