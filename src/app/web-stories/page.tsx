"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteDetection } from "@/hooks/useSiteDetection";
import { getActiveSite } from "@/config/sites";
import { SiteConfig } from "@/config/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Story {
  id: number;
  title: string;
  summary: string;
  featured_image: string;
  category: string;
  slug: string;
  published_at: string;
  author: string;
}

export default function WebStoriesPage() {
  const detectedSite = useSiteDetection();
  const [site, setSite] = useState<SiteConfig>(getActiveSite());
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (detectedSite) {
      setSite(detectedSite);
    }
  }, [detectedSite]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stories?site=${site.slug}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [site]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header site={site} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Web Stories
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Visual stories from {site.name}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] bg-gray-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <p className="text-gray-500 text-center py-20 text-xl">
            No stories available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/web-stories/${story.slug}`}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 block"
              >
                <img
                  src={story.featured_image}
                  alt={story.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-block bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-2">
                    {story.category}
                  </span>
                  <h2 className="text-sm font-bold leading-tight line-clamp-3">
                    {story.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer site={site} about={`${site.name} is ${site.city}'s #1 source for breaking news, politics, entertainment, and local coverage across ${site.state}.`} />
    </div>
  );
}
