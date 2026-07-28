"use client";

import { SiteConfig } from "@/config/site-config";
import { Mail } from "lucide-react";
import Link from "next/link";

const categories = ["Home", "Local News", "US News", "World", "Politics", "Sports", "Technology", "Entertainment", "Lifestyle", "Opinion"];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Careers", href: "/careers" },
  { label: "Advertise", href: "/advertise" },
  { label: "Ethics Policy", href: "/ethics" },
  { label: "Corrections", href: "/corrections" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

interface FooterProps {
  site: SiteConfig;
  about: string;
}

export default function Footer({ site, about }: FooterProps) {
  return (
    <footer className="bg-[#111] text-white mt-10">
      {/* Main footer */}
      <div className="max-w-[1300px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* About */}
          <div className="md:col-span-4">
            <h3 className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl md:text-3xl text-white" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                {site.logoFirst}
              </span>
              <span className="text-2xl md:text-3xl text-[#c1121f]" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                {site.logoSecond}
              </span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">{about}</p>
            {/* Social icons removed — dead "#" links hurt AdSense site-quality review.
                Re-add only with real per-site social profile URLs. */}
          </div>

          {/* Categories */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.map((cat) => {
                const href = cat === "Home" ? "/" : `/${cat.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <li key={cat}>
                    <Link href={href} className="text-gray-400 text-sm hover:text-white hover:pl-1 transition-all">
                      {cat}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Company
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-white hover:pl-1 transition-all">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Newsletter
            </h4>
            <p className="text-gray-400 text-sm mb-4">Get breaking news and top stories delivered to your inbox every morning.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2.5 rounded text-sm bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c1121f]"
              />
              <button className="bg-[#c1121f] hover:bg-[#9b111e] px-4 py-2.5 rounded transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-600 text-[10px] mt-2">By subscribing, you agree to our Privacy Policy.</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1300px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600 text-[10px]">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</Link>
            <span>&bull;</span>
            <Link href="/dmca" className="hover:text-gray-400 transition-colors">DMCA</Link>
            <span>&bull;</span>
            <Link href="/editorial-policy" className="hover:text-gray-400 transition-colors">Editorial Policy</Link>
            <span>&bull;</span>
            <Link href="/advertise" className="hover:text-gray-400 transition-colors">Advertise With Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
