"use client";

import { feeds, CATEGORY_MAP } from "@/config/feeds";
import { Rss, Globe, MapPin } from "lucide-react";

export default function FeedsPage() {
  const categories = Array.from(new Set(feeds.map((f) => f.category)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Rss className="w-6 h-6 text-[#c1121f]" />
          Feed Configuration
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {feeds.length} feeds across {categories.length} categories
        </p>
      </div>

      {categories.map((category) => {
        const categoryFeeds = feeds.filter((f) => f.category === category);
        return (
          <div key={category} className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-1 capitalize">
              {CATEGORY_MAP[category] || category}
            </h2>
            <p className="text-gray-500 text-xs mb-4">
              {categoryFeeds.length} feed(s) &middot; Every{" "}
              {categoryFeeds[0].intervalHours}h
            </p>
            <div className="space-y-3">
              {categoryFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="mt-0.5">
                    {feed.scope === "local" ? (
                      <MapPin className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{feed.id}</p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {typeof feed.url === "string"
                        ? feed.url
                        : `Dynamic URL (per ${feed.scope === "local" ? "state" : "region"})`}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Max: {feed.maxItems} items</span>
                      <span>
                        Scope:{" "}
                        <span
                          className={
                            feed.scope === "local"
                              ? "text-blue-500"
                              : feed.scope === "world"
                                ? "text-purple-500"
                                : "text-green-500"
                          }
                        >
                          {feed.scope}
                        </span>
                      </span>
                      <span>Interval: {feed.intervalHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
