"use client";

import { SiteConfig } from "@/config/site-config";
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

const categories = ["Home", "Local News", "US News", "World", "Politics", "Sports", "Technology", "Entertainment", "Lifestyle", "Opinion"];

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
            <h3
              className="text-3xl tracking-tight mb-4"
              style={{ fontFamily: "'DM Serif Display', serif", letterSpacing: "0.01em" }}
            >
              {site.name.toUpperCase()}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">{about}</p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#c1121f] transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white hover:pl-1 transition-all">
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Company
            </h4>
            <ul className="space-y-2">
              {["About Us", "Contact", "Careers", "Advertise", "Ethics Policy", "Corrections", "Terms of Use", "Privacy Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-400 text-sm hover:text-white hover:pl-1 transition-all">
                    {link}
                  </a>
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
          <p className="text-gray-600 text-[10px]">
            Privacy Policy &bull; Terms of Use &bull; Do Not Sell My Information &bull; Advertise With Us
          </p>
        </div>
      </div>
    </footer>
  );
}
