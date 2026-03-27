"use client";

import { getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryBlock from "@/components/CategoryBlock";
import FeaturedStory from "@/components/FeaturedStory";
import Sidebar from "@/components/Sidebar";
import LatestPostsGrid from "@/components/LatestPostsGrid";
import Footer from "@/components/Footer";

const site = getActiveSite();
const content = generateContent(site);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Header site={site} />

      {/* Hero */}
      <HeroSection main={content.heroMain} side={content.heroSide} />

      {/* Main content + sidebar layout */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-8">
            <CategoryBlock title="Local News" articles={content.localNews} accent="#c1121f" />
            <CategoryBlock title="US News" articles={content.usNews} accent="#1a1a1a" />
            <CategoryBlock title="World News" articles={content.worldNews} accent="#0077b6" />

            {/* Featured Story */}
            <FeaturedStory article={content.featuredStory} />

            <CategoryBlock title="Politics" articles={content.politics} accent="#6a040f" />
            <CategoryBlock title="Technology" articles={content.technology} accent="#023e8a" />
            <CategoryBlock title="Sports" articles={content.sports} accent="#2d6a4f" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px]">
              <Sidebar
                trending={content.trending}
                latest={content.sidebarLatest}
                newsletter={content.sidebarNewsletter}
              />
            </div>
          </div>
        </div>

        {/* Latest Posts - full width */}
        <LatestPostsGrid articles={content.latestPosts} />
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
