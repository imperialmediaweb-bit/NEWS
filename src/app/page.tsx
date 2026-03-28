"use client";

import { useEffect, useState } from "react";
import { generateContent, SiteContent } from "@/data/generate-content";
import { useSiteDetection } from "@/hooks/useSiteDetection";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PopularSection from "@/components/PopularSection";
import BrandBanner from "@/components/BrandBanner";
import ThreeColumnSection from "@/components/ThreeColumnSection";
import CategoryBlock from "@/components/CategoryBlock";
import FeaturedStory from "@/components/FeaturedStory";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function Home() {
  const site = useSiteDetection();
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    if (!site) return;

    const mockContent = generateContent(site);
    setContent(mockContent);

    fetch(`/api/site?slug=${site.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles && data.articles.heroMain) {
          setContent({
            ...mockContent,
            ...data.articles,
            showcase: data.articles.localNews,
            celebrity: data.articles.entertainment,
            sidebarNewsletter: {
              title: `Subscribe to ${site.name}`,
              description: `Get the latest ${site.city} news delivered to your inbox`,
            },
            footerAbout: `${site.name} is ${site.city}'s #1 source for breaking news, politics, entertainment, and local coverage across ${site.state}.`,
          });
        }
      })
      .catch(() => {});
  }, [site]);

  if (!site || !content) return <div className="min-h-screen bg-[#f5f5f5]" />;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* HERO — big main story + side trending */}
      <HeroSection main={content.heroMain} side={content.heroSide} />

      {/* Ad banner */}
      <div className="bg-black text-white text-center py-4 my-2">
        <p className="text-sm md:text-base font-medium">
          Promote your business. <a href="#" className="text-[#c1121f] font-bold hover:underline">Contact us!</a>
        </p>
      </div>

      {/* POPULAR — trending stories row */}
      <div className="max-w-[1300px] mx-auto px-4">
        <PopularSection articles={content.popular} />
      </div>

      {/* Brand identity banner */}
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

      {/* Ad banner */}
      <div className="bg-black text-white text-center py-4 my-4">
        <p className="text-sm md:text-base font-medium">
          Promote your business. <a href="#" className="text-[#c1121f] font-bold hover:underline">Contact us!</a>
        </p>
      </div>

      {/* LATEST + SIDEBAR */}
      <div className="max-w-[1300px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CategoryBlock title="Latest Posts" articles={content.latestPosts} accent="#c1121f" layout="list" />
            <FeaturedStory article={content.featuredStory} />
            <CategoryBlock title="Entertainment" articles={content.entertainment} accent="#c1121f" layout="grid3" />
            <CategoryBlock title="Business & Finance" articles={content.business} accent="#c1121f" layout="lead-side" />
            <FeaturedStory article={content.featuredStory2} />
            <CategoryBlock title="Opinion" articles={content.opinion} accent="#c1121f" layout="lead-side" />
          </div>

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
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
