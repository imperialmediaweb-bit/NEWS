"use client";

import { getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";

import Header from "@/components/Header";
import PromoBanner from "@/components/PromoBanner";
import LocalNewsSection from "@/components/LocalNewsSection";
import PopularSection from "@/components/PopularSection";
import BrandBanner from "@/components/BrandBanner";
import ThreeColumnSection from "@/components/ThreeColumnSection";
import USNewsSection from "@/components/USNewsSection";
import ThreeColumnNews from "@/components/ThreeColumnNews";
import LatestPostsSection from "@/components/LatestPostsSection";
import Footer from "@/components/Footer";

const site = getActiveSite();
const content = generateContent(site);

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      <PromoBanner />

      <LocalNewsSection articles={content.localNews} />

      <PopularSection articles={content.popularArticles} />

      <BrandBanner site={site} />

      <ThreeColumnSection
        showcaseArticles={content.showcaseArticles}
        sportsArticles={content.sportsArticles}
        editorChoice={content.editorChoice}
      />

      <USNewsSection articles={content.usNewsArticles} />

      <ThreeColumnNews
        celebrityArticles={content.celebrityArticles}
        worldArticles={content.worldArticles}
        politicsArticles={content.politicsArticles}
      />

      <PromoBanner />

      <LatestPostsSection
        latestPosts={content.latestPosts}
        sidebarNew={content.sidebarNew}
        sidebarTech={content.sidebarTech}
        sidebarLifestyle={content.sidebarLifestyle}
      />

      <Footer
        site={site}
        footerLatest={content.footerLatest}
        footerPopular={content.footerPopular}
      />
    </div>
  );
}
