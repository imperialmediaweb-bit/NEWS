import { SiteConfig } from "@/config/site-config";

export interface Article {
  img: string;
  title: string;
  summary?: string;
  time: string;
  comments?: number;
  badge?: string;
  category?: string;
  date?: string;
}

export interface SiteContent {
  localNews: Article[];
  popularArticles: Article[];
  showcaseArticles: Article[];
  sportsArticles: Article[];
  editorChoice: Article[];
  usNewsArticles: Article[];
  celebrityArticles: Article[];
  worldArticles: Article[];
  politicsArticles: Article[];
  latestPosts: Article[];
  sidebarNew: Article[];
  sidebarTech: Article[];
  sidebarLifestyle: Article[];
  footerLatest: { title: string }[];
  footerPopular: { title: string }[];
}

export function generateContent(site: SiteConfig): SiteContent {
  const { city, state } = site;

  return {
    localNews: [
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=500&fit=crop",
        title: `${state} Governor faces calls to resign as corruption probe deepens`,
        category: "Local News",
        date: "March 26, 2026",
        time: "12 minutes ago",
      },
      {
        img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&h=500&fit=crop",
        title: `Major transit strike to paralyze ${city} as union rejects pay offer`,
        category: "Local News",
        date: "March 26, 2026",
        time: "45 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=800&h=500&fit=crop",
        title: `Gun violence crackdown: 150 arrests in major ${city} police operation`,
        category: "Local News",
        date: "March 25, 2026",
        time: "1 hour ago",
      },
    ],

    popularArticles: [
      {
        img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
        title: `${city} housing market crashes 15% as mortgage rates hit record highs`,
        category: "Money",
        date: "March 26, 2026",
        time: "45 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=300&fit=crop",
        title: `${city}'s star quarterback out for season after shocking practice injury`,
        category: "Sports",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=400&h=300&fit=crop",
        title: `Hollywood A-lister spotted house-hunting in ${city} — locals go wild`,
        category: "Celebrity",
        date: "March 25, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=300&fit=crop",
        title: `${city} school district faces $50M budget shortfall — teacher layoffs feared`,
        category: "Education",
        date: "March 25, 2026",
        time: "3 hours ago",
      },
    ],

    showcaseArticles: [
      {
        img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=200&h=150&fit=crop",
        title: `The ${city} restaurant that just won America's best diner award`,
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=150&fit=crop",
        title: `The $6 meal deal at this ${city} diner that celebrity chefs adore`,
        date: "March 25, 2026",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=150&fit=crop",
        title: `The secret ${state} vacation spot tourists haven't found yet`,
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop",
        title: "Doctor reveals the 5-minute morning routine that could add years to your life",
        date: "March 24, 2026",
        time: "8 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop",
        title: `${state}'s best BBQ joints revealed — is YOUR favorite on the list?`,
        date: "March 24, 2026",
        time: "10 hours ago",
      },
    ],

    sportsArticles: [
      {
        img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop",
        title: `TRADE BOMBSHELL: ${city}'s NFL team agrees to blockbuster $120M deal`,
        summary: `Front office officials have beaten three other franchises to land the most sought-after player in the league.`,
        category: "Sports",
        date: "March 26, 2026",
        time: "10 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=150&fit=crop",
        title: `MLB drama: ${state}'s team collapses in humiliating 14-1 playoff loss`,
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=150&fit=crop",
        title: `March Madness: ${state} college pulls off stunning last-second upset`,
        date: "March 25, 2026",
        time: "3 hours ago",
      },
    ],

    editorChoice: [
      {
        img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&h=150&fit=crop",
        title: `Inside the secretive ${city} club where power brokers make deals`,
        date: "March 26, 2026",
        time: "4 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=200&h=150&fit=crop",
        title: `${state} officials covered up toxic contamination in water supply`,
        date: "March 25, 2026",
        time: "6 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&h=150&fit=crop",
        title: `How anonymous LLCs own 30,000 homes across ${state}`,
        date: "March 25, 2026",
        time: "8 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=200&h=150&fit=crop",
        title: `I moved to ${city} five years ago — and I'd do it again in a heartbeat`,
        date: "March 24, 2026",
        time: "12 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=200&h=150&fit=crop",
        title: "Stop blaming social media for everything wrong with our children",
        date: "March 24, 2026",
        time: "14 hours ago",
      },
    ],

    usNewsArticles: [
      {
        img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
        title: "Congress deadlocked on immigration bill as government shutdown looms",
        summary: "House Speaker warns both parties that time is running out to reach a deal before the Friday deadline.",
        category: "US News",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=400&h=300&fit=crop",
        title: "Federal Reserve signals potential interest rate cuts amid economic slowdown",
        category: "US News",
        date: "March 26, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop",
        title: "Supreme Court takes up landmark Second Amendment case",
        category: "US News",
        date: "March 25, 2026",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=400&h=300&fit=crop",
        title: "New CDC report reveals alarming rise in antibiotic-resistant infections",
        category: "US News",
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
        title: "Social Security age could rise to 70 under radical Congressional proposal",
        category: "US News",
        date: "March 24, 2026",
        time: "6 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        title: "Federal infrastructure bill allocates $2B for highway repairs nationwide",
        category: "US News",
        date: "March 24, 2026",
        time: "8 hours ago",
      },
    ],

    celebrityArticles: [
      {
        img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=150&fit=crop",
        title: `Taylor Swift confirms surprise concert at ${city} stadium`,
        category: "Celebrity",
        date: "March 26, 2026",
        time: "30 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=200&h=150&fit=crop",
        title: "Dancing With The Stars 2026: First contestants revealed",
        category: "Celebrity",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=150&fit=crop",
        title: "Netflix smash hit breaks all-time streaming record with 200M views",
        category: "Celebrity",
        date: "March 25, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&h=150&fit=crop",
        title: `Kardashian documentary sparks controversy after filming in ${city}`,
        category: "Celebrity",
        date: "March 25, 2026",
        time: "4 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=200&h=150&fit=crop",
        title: `New blockbuster filming on location in downtown ${city}`,
        category: "Celebrity",
        date: "March 24, 2026",
        time: "6 hours ago",
      },
    ],

    worldArticles: [
      {
        img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=200&h=150&fit=crop",
        title: "Earthquake devastation: Thousands feared dead after 7.8 magnitude quake",
        category: "World",
        date: "March 26, 2026",
        time: "25 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=200&h=150&fit=crop",
        title: "US-China tensions soar as naval standoff erupts in South China Sea",
        category: "World",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=200&h=150&fit=crop",
        title: "Australian wildfires force mass evacuation of 100,000 near Sydney",
        category: "World",
        date: "March 25, 2026",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=200&h=150&fit=crop",
        title: "North Korea launches missile over Japan in most provocative test yet",
        category: "World",
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&h=150&fit=crop",
        title: "European Union announces sweeping new climate legislation package",
        category: "World",
        date: "March 24, 2026",
        time: "8 hours ago",
      },
    ],

    politicsArticles: [
      {
        img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=150&fit=crop",
        title: `${state} Senator under fire as leaked memo reveals secret tax hike plan`,
        category: "Politics",
        date: "March 26, 2026",
        time: "30 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=200&h=150&fit=crop",
        title: `${city} Mayor defects from party over immigration stance`,
        category: "Politics",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=200&h=150&fit=crop",
        title: `Former ${state} Governor's memoir: 'I nearly resigned over scandal'`,
        category: "Politics",
        date: "March 25, 2026",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=200&h=150&fit=crop",
        title: `New poll shows ${state} voters shifting dramatically on key ballot measure`,
        category: "Politics",
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=200&h=150&fit=crop",
        title: "White House announces new executive orders on healthcare reform",
        category: "Politics",
        date: "March 24, 2026",
        time: "8 hours ago",
      },
    ],

    latestPosts: [
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=300&fit=crop",
        title: `${state} Governor faces calls to resign as corruption probe reaches inner circle`,
        summary: `Senior aides are reported to be cooperating with federal investigators as the scandal deepens.`,
        category: "Breaking News",
        date: "March 26, 2026",
        time: "12 minutes ago",
      },
      {
        img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=400&h=300&fit=crop",
        title: `Major transit strike to paralyze ${city} as union rejects 'insulting' pay offer`,
        summary: `Commuters face chaos as three unions announce coordinated walkout affecting every route.`,
        category: "Local News",
        date: "March 26, 2026",
        time: "45 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
        title: `${city} home prices plunge 18% in worst quarter since 2008 financial crisis`,
        summary: `Homeowners across ${state} are watching their property values tumble as high interest rates crush the market.`,
        category: "Money",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop",
        title: `${state} hospital wait times top 8 hours as winter flu season overwhelms ERs`,
        summary: `Healthcare workers warn the system is at breaking point as patient numbers surge.`,
        category: "Health",
        date: "March 25, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
        title: `Parents furious as ${city} school bans packed lunches in 'nanny state' uproar`,
        summary: `The controversial policy has sparked fierce debate among parents and educators alike.`,
        category: "Education",
        date: "March 25, 2026",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop",
        title: `Dramatic footage shows roof collapse at major ${city} shopping mall`,
        summary: `Emergency services responded within minutes and miraculously no one was seriously injured.`,
        category: "Local News",
        date: "March 25, 2026",
        time: "4 hours ago",
      },
    ],

    sidebarNew: [
      {
        img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=150&h=100&fit=crop",
        title: `Gun violence crackdown: 150 arrests in ${city}`,
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1560472355-536de3962603?w=150&h=100&fit=crop",
        title: `Financial expert: Do this before April or lose thousands on ${state} taxes`,
        date: "March 26, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&h=100&fit=crop",
        title: "Social Security age could rise to 70 under new proposal",
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=150&h=100&fit=crop",
        title: `NASCAR star hints at shock retirement after ${state} race`,
        date: "March 25, 2026",
        time: "6 hours ago",
      },
    ],

    sidebarTech: [
      {
        img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=100&fit=crop",
        title: "Apple announces revolutionary AI features for iPhone 18",
        date: "March 26, 2026",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=150&h=100&fit=crop",
        title: "SpaceX completes historic mission with record payload delivery",
        date: "March 25, 2026",
        time: "4 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=150&h=100&fit=crop",
        title: "New cybersecurity threats target millions of home routers nationwide",
        date: "March 25, 2026",
        time: "6 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&h=100&fit=crop",
        title: "Electric vehicle sales surge 40% as new battery tech cuts costs",
        date: "March 24, 2026",
        time: "12 hours ago",
      },
    ],

    sidebarLifestyle: [
      {
        img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=150&h=100&fit=crop",
        title: `Best weekend brunch spots in ${city} you need to try`,
        date: "March 26, 2026",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=100&fit=crop",
        title: "10 simple habits that will transform your morning routine",
        date: "March 25, 2026",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=150&h=100&fit=crop",
        title: `Hidden hiking trails near ${city} for spring adventures`,
        date: "March 25, 2026",
        time: "8 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=100&fit=crop",
        title: "The kitchen gadgets professional chefs actually use at home",
        date: "March 24, 2026",
        time: "10 hours ago",
      },
    ],

    footerLatest: [
      { title: `${state} Governor faces corruption probe` },
      { title: `Transit strike threatens ${city} commuters` },
      { title: `${city} housing market crashes 15%` },
      { title: `Hospital wait times hit record highs` },
      { title: `School district faces $50M shortfall` },
    ],

    footerPopular: [
      { title: `NFL team lands $120M blockbuster deal` },
      { title: `Taylor Swift confirms ${city} concert` },
      { title: `Hollywood star house-hunting in ${city}` },
      { title: `Congress deadlocked on immigration bill` },
      { title: `Best restaurants in ${city} revealed` },
    ],
  };
}
