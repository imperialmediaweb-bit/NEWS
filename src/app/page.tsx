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

      {/* Hero — full width, big images */}
      <HeroSection main={content.heroMain} side={content.heroSide} />

      {/* Main content + sidebar layout */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-8">
            <CategoryBlock title="Local News" articles={content.localNews} accent="#c1121f" />
            <CategoryBlock title="US News" articles={content.usNews} accent="#1a1a1a" />

            {/* First Featured Story */}
            <FeaturedStory article={content.featuredStory} />

            <CategoryBlock title="World News" articles={content.worldNews} accent="#0077b6" />
            <CategoryBlock title="Politics" articles={content.politics} accent="#6a040f" />

            {/* Second Featured Story */}
            <FeaturedStory article={content.featuredStory2} />

            <CategoryBlock title="Entertainment" articles={content.entertainment} accent="#9b2226" />
            <CategoryBlock title="Business" articles={content.business} accent="#1a1a1a" />
            <CategoryBlock title="Technology" articles={content.technology} accent="#023e8a" />
            <CategoryBlock title="Sports" articles={content.sports} accent="#2d6a4f" />
            <CategoryBlock title="Opinion" articles={content.opinion} accent="#774936" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[160px]">
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
