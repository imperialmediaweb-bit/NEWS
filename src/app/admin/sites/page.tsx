"use client";

import { sites } from "@/config/sites";
import { Globe, ExternalLink } from "lucide-react";

export default function SitesPage() {
  const siteList = Object.values(sites);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sites ({siteList.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siteList.map((site) => (
          <div
            key={site.slug}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">
                  <span>{site.logoFirst}</span>{" "}
                  <span className="text-[var(--accent)]">{site.logoSecond}</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">{site.tagline}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Active
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-gray-400" />
                <span>{site.domain}</span>
                <a
                  href={`https://${site.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="flex gap-4">
                <span>
                  📍 {site.city}, {site.stateAbbr}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
