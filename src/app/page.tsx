"use client";

import { getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PopularSection from "@/components/PopularSection";
import BrandBanner from "@/components/BrandBanner";
import ThreeColumnSection from "@/components/ThreeColumnSection";
import CategoryBlock from "@/components/CategoryBlock";
import FeaturedStory from "@/components/FeaturedStory";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const site = getActiveSite();
const content = generateContent(site);

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header site={site} />

      {/* LOCAL NEWS — 3-column grid with big images */}
      <HeroSection main={content.heroMain} side={content.heroSide} />

      {/* POPULAR — small horizontal row */}
      <div className="max-w-[1300px] mx-auto px-4">
        <PopularSection articles={content.popular} />
      </div>

      {/* Brand Banner — logo + about text */}
      <BrandBanner site={site} />

      {/* Three column: SHOWCASE | SPORTS | EDITOR'S CHOICE */}
      <div className="max-w-[1300px] mx-auto px-4">
        <ThreeColumnSection
          columns={[
            { title: "Showcase", accent: "#c1121f", articles: content.showcase },
            { title: "Sports", accent: "#c1121f", articles: content.sports },
            { title: "Editor's Choice", accent: "#c1121f", articles: content.technology },
          ]}
        />
      </div>

      {/* US NEWS — 3-column grid */}
      <div className="max-w-[1300px] mx-auto px-4">
        <CategoryBlock title="US News" articles={content.usNews} accent="#c1121f" layout="grid3" />
      </div>

      {/* Three column: CELEBRITY | WORLD | POLITICS */}
      <div className="max-w-[1300px] mx-auto px-4">
        <ThreeColumnSection
          columns={[
            { title: "Celebrity", accent: "#c1121f", articles: content.celebrity },
            { title: "World", accent: "#c1121f", articles: content.worldNews },
            { title: "Politics", accent: "#c1121f", articles: content.politics },
          ]}
        />
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white text-center py-4 my-6">
        <p className="text-base md:text-lg font-medium">
          Promote your business. <a href="#" className="font-bold hover:underline">Contact us!</a>
        </p>
      </div>

      {/* LATEST POSTS — list layout with sidebar */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CategoryBlock title="Latest Posts" articles={content.latestPosts} accent="#c1121f" layout="list" />

            {/* Featured Story */}
            <FeaturedStory article={content.featuredStory} />

            {/* More sections for length */}
            <CategoryBlock title="Entertainment" articles={content.entertainment} accent="#c1121f" layout="grid3" />
            <CategoryBlock title="Business & Finance" articles={content.business} accent="#c1121f" layout="lead-side" />

            {/* Second Featured Story */}
            <FeaturedStory article={content.featuredStory2} />

            <CategoryBlock title="Opinion" articles={content.opinion} accent="#c1121f" layout="lead-side" />
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
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
