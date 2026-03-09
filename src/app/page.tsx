"use client";

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

/* ── Category data ────────────────────────────────────────────── */

const newsArticles = [
  {
    img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&h=500&fit=crop",
    title: "Major rail strike to cripple Britain as unions reject 'insulting' pay offer",
    summary: "Commuters face chaos as three unions announce coordinated walkout affecting every region of the country.",
    time: "20 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=400&h=300&fit=crop",
    title: "Knife crime crackdown: 200 arrests in Met Police dawn raids across London",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop",
    title: "NHS waiting list tops 8 million for first time as winter pressures bite",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    title: "Parents fury as school bans packed lunches in 'nanny state' row",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop",
    title: "Dramatic footage shows roof collapse at major shopping centre",
    time: "4 hours ago",
  },
];

const politicsArticles = [
  {
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
    title: "Chancellor under fire as leaked memo reveals secret plan to raise council tax by 10%",
    summary: "Opposition demands urgent Commons statement after document surfaces showing Treasury modelling for massive local tax hikes.",
    time: "30 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=400&h=300&fit=crop",
    title: "Labour frontbencher quits over party's stance on Gaza ceasefire vote",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop",
    title: "Boris Johnson memoir revelations: 'I nearly resigned over Partygate'",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=400&h=300&fit=crop",
    title: "Scottish independence poll shows biggest 'Yes' lead in two years",
    time: "5 hours ago",
  },
];

const moneyArticles = [
  {
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop",
    title: "FTSE 100 plunges 300 points in worst day since pandemic as banks sell off",
    summary: "Investors flee UK stocks amid fears of stagflation and a looming property crash across the South East.",
    time: "15 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    title: "Energy bills to soar AGAIN — Ofgem confirms April price cap rise of 12%",
    time: "45 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop",
    title: "Martin Lewis: 'Do this ONE thing before April or you'll lose thousands'",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop",
    title: "State pension age could rise to 69 under radical Treasury plan",
    time: "4 hours ago",
  },
];

const worldArticles = [
  {
    img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=500&fit=crop",
    title: "Earthquake devastation: Thousands feared dead as 7.8 magnitude quake strikes Turkey",
    summary: "Rescue teams from 30 countries are scrambling to reach survivors trapped under collapsed buildings across the south-east.",
    time: "25 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=300&fit=crop",
    title: "Trump announces shock tariffs on European goods in escalating trade war",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop",
    title: "Australian wildfires force mass evacuation of 100,000 near Sydney",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=400&h=300&fit=crop",
    title: "North Korea launches missile over Japan in 'most provocative test yet'",
    time: "5 hours ago",
  },
];

const sportArticles = [
  {
    img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop",
    title: "TRANSFER BOMBSHELL: Liverpool agree £120m world-record deal for PSG superstar",
    summary: "Anfield bosses have beaten Real Madrid and Man City to sign the most sought-after player on the planet.",
    time: "10 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
    title: "Ashes drama: England collapse to 47 all out in humiliating first innings",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    title: "Six Nations: Wales pull off stunning last-minute victory over France in Cardiff",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=300&fit=crop",
    title: "Hamilton hints at shock F1 retirement after disastrous Bahrain qualifying",
    time: "5 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=300&fit=crop",
    title: "Fury vs Usyk II: Date confirmed for biggest heavyweight rematch in decades",
    time: "6 hours ago",
  },
];

const showbizArticles = [
  {
    img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
    title: "EXCLUSIVE: Adele confirms surprise Glastonbury headline slot with emotional Instagram post",
    summary: "The superstar singer broke down in tears as she announced her return to the Pyramid Stage for a record third time.",
    time: "30 min ago",
  },
  {
    img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=300&fit=crop",
    title: "I'm A Celebrity 2026: First contestants revealed — and fans are divided",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
    title: "Netflix smash hit breaks all-time streaming record with 200 million views",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop",
    title: "David Beckham's new documentary sparks fresh rift with former teammates",
    time: "4 hours ago",
  },
];

const lifestyleArticles = [
  {
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop",
    title: "The £5 meal deal that top chefs say is actually better than most restaurant food",
    summary: "We asked Michelin-starred chefs to blind taste supermarket ready meals — and the results might shock you.",
    time: "1 hour ago",
  },
  {
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    title: "NHS doctor reveals the 5-minute morning routine that could add years to your life",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    title: "Britain's best fish and chip shops revealed — is YOUR local on the list?",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop",
    title: "The secret Greek island paradise Brits haven't discovered yet",
    time: "5 hours ago",
  },
];

const opinionArticles = [
  {
    img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&h=500&fit=crop",
    title: "Britain is sleepwalking into a pensions catastrophe — and nobody in power seems to care",
    summary: "Unless we act now, millions of today's workers face a retirement of grinding poverty, writes Robert Hartley.",
    time: "2 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=300&fit=crop",
    title: "Stop blaming social media for everything wrong with our children",
    time: "3 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop",
    title: "The BBC licence fee is an outdated tax on the poor — it's time to scrap it",
    time: "5 hours ago",
  },
  {
    img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&h=300&fit=crop",
    title: "I voted Leave — and I'd do it again in a heartbeat. Here's why.",
    time: "6 hours ago",
  },
];

/* ── Page ─────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <BreakingNewsTicker />
      <Header />
      <HeroSection />

      <Separator />
      <SecondaryStories />

      {/* News + Most Read sidebar layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <CategorySection title="News" articles={newsArticles} />
          </div>
          <div className="lg:col-span-4">
            <MostReadSidebar />
          </div>
        </div>
      </div>

      <CategorySection title="Politics" articles={politicsArticles} variant="alt" />
      <CategorySection title="Money" articles={moneyArticles} />
      <CategorySection title="World" articles={worldArticles} variant="alt" />

      <ExclusivesSection />

      <CategorySection title="Sport" articles={sportArticles} />
      <CategorySection title="Showbiz" articles={showbizArticles} variant="alt" />

      <VideoSection />

      <CategorySection title="Lifestyle" articles={lifestyleArticles} variant="alt" />
      <CategorySection title="Opinion" articles={opinionArticles} />

      <OpinionSection />
      <NewsletterSignup />
      <Footer />
    </div>
  );
}
