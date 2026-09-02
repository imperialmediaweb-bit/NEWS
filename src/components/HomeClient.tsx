"use client";

import type { SiteConfig } from "@/config/site-config";
import type { HomeArticles } from "@/lib/homepage-data";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PopularSection from "@/components/PopularSection";
import BrandBanner from "@/components/BrandBanner";
import ThreeColumnSection from "@/components/ThreeColumnSection";
import CategoryBlock from "@/components/CategoryBlock";
import FeaturedStory from "@/components/FeaturedStory";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

interface HomeClientProps {
  site: SiteConfig;
  articles: HomeArticles;
}

export default function HomeClient({ site, articles }: HomeClientProps) {
  const sidebarNewsletter = {
    title: `Subscribe to ${site.name}`,
    description: `Get the latest ${site.city} news delivered to your inbox`,
  };
  const footerAbout = `${site.name} is ${site.city}'s #1 source for breaking news, politics, entertainment, and local coverage across ${site.state}.`;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* HERO — big main story + side trending */}
      {articles.heroMain && <HeroSection main={articles.heroMain} side={articles.heroSide} />}

      {/* Ad banner */}
      <div className="bg-black text-white text-center py-3 md:py-4 my-2">
        <p className="text-xs md:text-base font-medium px-4">
          Promote your business. <a href="/advertise" className="text-[var(--accent)] font-bold hover:underline">Contact us!</a>
        </p>
      </div>

      {/* POPULAR — trending stories row */}
      <div className="max-w-[1300px] mx-auto px-3 md:px-4">
        <PopularSection articles={articles.popular} />
      </div>

      {/* Brand identity banner */}
      <BrandBanner site={site} />

      {/* Three column: SHOWCASE | SPORTS | EDITOR'S CHOICE */}
      <div className="max-w-[1300px] mx-auto px-4">
        <ThreeColumnSection
          columns={[
            { title: "Showcase", accent: "var(--accent)", articles: articles.localNews },
            { title: "Sports", accent: "var(--accent)", articles: articles.sports },
            { title: "Editor's Choice", accent: "var(--accent)", articles: articles.technology },
          ]}
        />
      </div>

      {/* US NEWS — 3-column grid */}
      <div className="max-w-[1300px] mx-auto px-4">
        <CategoryBlock title="US News" articles={articles.usNews} accent="var(--accent)" layout="grid3" />
      </div>

      {/* Three column: CELEBRITY | WORLD | POLITICS */}
      <div className="max-w-[1300px] mx-auto px-4">
        <ThreeColumnSection
          columns={[
            { title: "Celebrity", accent: "var(--accent)", articles: articles.entertainment },
            { title: "World", accent: "var(--accent)", articles: articles.worldNews },
            { title: "Politics", accent: "var(--accent)", articles: articles.politics },
          ]}
        />
      </div>

      {/* Ad banner */}
      <div className="bg-black text-white text-center py-4 my-4">
        <p className="text-sm md:text-base font-medium">
          Promote your business. <a href="/advertise" className="text-[var(--accent)] font-bold hover:underline">Contact us!</a>
        </p>
      </div>

      {/* LATEST + SIDEBAR */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CategoryBlock title="Latest Posts" articles={articles.latestPosts} accent="var(--accent)" layout="list" />
            {articles.featuredStory && <FeaturedStory article={articles.featuredStory} />}
            <CategoryBlock title="Entertainment" articles={articles.entertainment} accent="var(--accent)" layout="grid3" />
            <CategoryBlock title="Business & Finance" articles={articles.business} accent="var(--accent)" layout="lead-side" />
            {articles.featuredStory2 && <FeaturedStory article={articles.featuredStory2} />}
            <CategoryBlock title="Opinion" articles={articles.opinion} accent="var(--accent)" layout="lead-side" />
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px]">
              <Sidebar
                trending={articles.trending}
                latest={articles.sidebarLatest}
                newsletter={sidebarNewsletter}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={footerAbout} />
    </div>
  );
}
