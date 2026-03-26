"use client";

import { getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";

import BreakingNewsTicker from "@/components/BreakingNewsTicker";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SecondaryStories from "@/components/SecondaryStories";
import MostReadSidebar from "@/components/MostReadSidebar";
import CategorySection from "@/components/CategorySection";
import ExclusivesSection from "@/components/ExclusivesSection";
import VideoSection from "@/components/VideoSection";
import OpinionSection from "@/components/OpinionSection";
import NewsletterSignup from "@/components/NewsletterSignup";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

const site = getActiveSite();
const content = generateContent(site);

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <BreakingNewsTicker headlines={content.breakingHeadlines} />
      <Header site={site} />

      {/* Ad banner — Alaska Express style */}
      <div className="bg-tabloid-red">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 text-center">
          <span className="text-white text-sm font-bold">
            Promote your business. Contact us!
          </span>
        </div>
      </div>

      <HeroSection heroStory={content.heroStory} sideStories={content.heroSideStories} />

      <Separator />
      <SecondaryStories stories={content.secondaryStories} />

      {/* Local News + Most Read sidebar layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <CategorySection title="Local News" articles={content.newsArticles} />
          </div>
          <div className="lg:col-span-4">
            <MostReadSidebar items={content.mostRead} />
          </div>
        </div>
      </div>

      <CategorySection title="Politics" articles={content.politicsArticles} variant="alt" />
      <CategorySection title="Money" articles={content.moneyArticles} />
      <CategorySection title="World" articles={content.worldArticles} variant="alt" />

      <ExclusivesSection exclusives={content.exclusives} />

      <CategorySection title="Sports" articles={content.sportArticles} />
      <CategorySection title="Celebrity" articles={content.celebrityArticles} variant="alt" />

      <VideoSection videos={content.videos} />

      <CategorySection title="Lifestyle" articles={content.lifestyleArticles} variant="alt" />
      <CategorySection title="Opinion" articles={content.opinionArticles} />

      <OpinionSection columnists={content.columnists} />
      <NewsletterSignup site={site} />
      <Footer site={site} />
    </div>
  );
}
