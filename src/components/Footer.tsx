"use client";

import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SiteConfig } from "@/config/site-config";

const footerLinks = {
  "News & Politics": ["Local News", "US News", "Politics", "Crime", "Education", "Health", "Science"],
  "Sports": ["Football", "Basketball", "Baseball", "Hockey", "Soccer", "MMA", "Golf"],
  "Entertainment": ["Celebrity", "TV & Film", "Music", "Lifestyle", "Travel", "Food", "Fashion"],
  "Opinion": ["Columnists", "Editorials", "Letters", "Cartoons", "Debates"],
  "About Us": ["About", "Contact", "Advertise", "Work With Us", "Corrections", "Terms of Use", "Privacy Policy"],
};

interface FooterProps {
  site: SiteConfig;
}

export default function Footer({ site }: FooterProps) {
  return (
    <footer className="bg-tabloid-black text-white">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4
                className="font-bold text-sm uppercase tracking-wider text-tabloid-accent-red mb-4"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-800" />

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-0">
            <div className="bg-tabloid-red px-2 py-0.5">
              <span className="text-white text-lg font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                {site.logoFirst}
              </span>
            </div>
            <div className="bg-white px-2 py-0.5">
              <span className="text-tabloid-black text-lg font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                {site.logoSecond}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-tabloid-red transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-tabloid-red transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-tabloid-red transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-tabloid-red transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>

          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
