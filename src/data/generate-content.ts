import { SiteConfig } from "@/config/site-config";

export interface Article {
  img: string;
  title: string;
  summary?: string;
  time: string;
  comments?: number;
  badge?: string;
}

export interface Columnist {
  img: string;
  name: string;
  role: string;
  title: string;
}

export interface VideoItem {
  img: string;
  title: string;
  duration: string;
  time: string;
}

export interface SiteContent {
  breakingHeadlines: string[];
  heroStory: Article;
  heroSideStories: Article[];
  secondaryStories: Article[];
  mostRead: { title: string; comments: number }[];
  newsArticles: Article[];
  politicsArticles: Article[];
  moneyArticles: Article[];
  worldArticles: Article[];
  sportArticles: Article[];
  celebrityArticles: Article[];
  lifestyleArticles: Article[];
  opinionArticles: Article[];
  exclusives: { img: string; title: string; summary: string; time: string; tag: string }[];
  videos: VideoItem[];
  columnists: Columnist[];
}

export function generateContent(site: SiteConfig): SiteContent {
  const { name, city, state } = site;

  return {
    breakingHeadlines: [
      `BREAKING: ${state} Governor declares state of emergency after severe flooding hits ${city}`,
      `SHOCK: Major ${city} employer announces 2,000 layoffs amid restructuring`,
      `EXCLUSIVE: ${state} State Police launch investigation into city hall corruption scandal`,
      `URGENT: Federal authorities raid ${city} business district in massive fraud probe`,
      `BREAKING: ${state} legislature passes controversial education reform bill`,
      `JUST IN: Massive wildfire threatens communities outside ${city} — evacuations ordered`,
    ],

    heroStory: {
      img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=1200&h=700&fit=crop",
      badge: "Breaking News",
      title: `${state} Governor faces calls to resign as corruption probe reaches inner circle`,
      summary: `Senior aides are reported to be cooperating with federal investigators tonight as the scandal engulfing the ${state} Governor's office deepens, with calls for resignation now coming from within the Governor's own party.`,
      time: "12 minutes ago",
      comments: 1247,
    },

    heroSideStories: [
      {
        img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop",
        badge: "Money",
        title: `${city} housing market crashes 15% as mortgage rates hit highest level in 20 years`,
        time: "45 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop",
        badge: "Sports",
        title: `${city}'s star quarterback out for season after shocking practice injury`,
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=600&h=400&fit=crop",
        badge: "Celebrity",
        title: `Hollywood A-lister spotted house-hunting in ${city} — locals go wild`,
        time: "2 hours ago",
      },
    ],

    secondaryStories: [
      {
        img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=400&fit=crop",
        badge: "Local News",
        title: `${city} school district faces $50M budget shortfall — teacher layoffs feared`,
        summary: `Parents and teachers rally at City Hall as the superintendent warns of "devastating cuts" to programs across the district.`,
        time: "35 min ago",
        comments: 843,
      },
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&h=400&fit=crop",
        badge: "US News",
        title: "Congress deadlocked on immigration bill as government shutdown looms",
        summary: "House Speaker warns both parties that time is running out to reach a deal before the Friday deadline.",
        time: "1 hour ago",
        comments: 1205,
      },
      {
        img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop",
        badge: "Lifestyle",
        title: `The ${city} restaurant that just won America's best diner award`,
        summary: `A tiny family-run spot in downtown ${city} has beaten thousands of competitors to claim the coveted title.`,
        time: "2 hours ago",
        comments: 567,
      },
      {
        img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop",
        badge: "Sports",
        title: `${state} college football team pulls off biggest upset in program history`,
        summary: "Fans stormed the field after a last-second touchdown sealed an unforgettable victory.",
        time: "3 hours ago",
        comments: 2100,
      },
    ],

    mostRead: [
      { title: `${city} teacher arrested after 'inappropriate messages' to student surface online`, comments: 4200 },
      { title: `How to save $5,000 on your ${state} property taxes — the loophole most homeowners miss`, comments: 3800 },
      { title: `Fury as ${city} Council spends $3M on bike lanes while potholes destroy cars`, comments: 3100 },
      { title: `Inside the $12M mansion where reality TV star threw 'wild' party in ${city}`, comments: 2900 },
      { title: `${state} hospital ER wait times hit record 9 hours amid staffing crisis`, comments: 2600 },
      { title: `Mom wins $75,000 payout after Walmart 'humiliated' her at ${city} store`, comments: 2400 },
      { title: `Dashcam catches terrifying road rage incident on ${state} highway`, comments: 2100 },
      { title: `Weather alert: ${state} braces for 'historic' heatwave with temps over 110°F`, comments: 1900 },
      { title: `Former President 'blindsided' party leaders with surprise ${state} rally`, comments: 1800 },
      { title: `Elderly veteran, 84, fighting eviction from ${city} home after 40 years`, comments: 1600 },
    ],

    newsArticles: [
      {
        img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&h=500&fit=crop",
        title: `Major transit strike to paralyze ${city} as union rejects 'insulting' pay offer`,
        summary: `Commuters face chaos as three unions announce coordinated walkout affecting every route in the ${city} metro area.`,
        time: "20 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=400&h=300&fit=crop",
        title: `Gun violence crackdown: 150 arrests in major ${city} police operation`,
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=300&fit=crop",
        title: `${state} hospital wait times top 8 hours as winter flu season overwhelms ERs`,
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
        title: `Parents furious as ${city} school bans packed lunches in 'nanny state' uproar`,
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop",
        title: `Dramatic footage shows roof collapse at major ${city} shopping mall`,
        time: "4 hours ago",
      },
    ],

    politicsArticles: [
      {
        img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
        title: `${state} Senator under fire as leaked memo reveals secret plan to raise property taxes by 12%`,
        summary: `Opposition demands urgent hearing after document surfaces showing state officials modeled massive tax hikes without public input.`,
        time: "30 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=400&h=300&fit=crop",
        title: `${city} Mayor defects from party over controversial immigration stance`,
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop",
        title: `Former ${state} Governor's memoir revelations: 'I nearly resigned over scandal'`,
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=400&h=300&fit=crop",
        title: `New poll shows ${state} voters shifting dramatically on key ballot measure`,
        time: "5 hours ago",
      },
    ],

    moneyArticles: [
      {
        img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop",
        title: `${city} home prices plunge 18% in worst quarter since 2008 financial crisis`,
        summary: `Homeowners across ${state} are watching their property values tumble as high interest rates crush the local real estate market.`,
        time: "15 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
        title: `${state} energy bills to spike AGAIN — regulators confirm 15% rate hike in April`,
        time: "45 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop",
        title: `Financial expert: 'Do this ONE thing before April or you'll lose thousands on your ${state} taxes'`,
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop",
        title: `Social Security age could rise to 70 under radical Congressional proposal`,
        time: "4 hours ago",
      },
    ],

    worldArticles: [
      {
        img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=500&fit=crop",
        title: "Earthquake devastation: Thousands feared dead as 7.8 magnitude quake strikes Turkey",
        summary: "Rescue teams from 30 countries are scrambling to reach survivors trapped under collapsed buildings across the region.",
        time: "25 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=300&fit=crop",
        title: "US-China tensions soar as naval standoff erupts in South China Sea",
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
    ],

    sportArticles: [
      {
        img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop",
        title: `TRADE BOMBSHELL: ${city}'s NFL team agrees to blockbuster $120M deal for superstar wide receiver`,
        summary: `Front office officials have beaten three other franchises to land the most sought-after player in the league.`,
        time: "10 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
        title: `MLB drama: ${state}'s team collapses in humiliating 14-1 playoff loss`,
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
        title: `March Madness: ${state} college pulls off stunning last-second upset over #1 seed`,
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=300&fit=crop",
        title: `NASCAR star hints at shock retirement after disastrous ${state} race weekend`,
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=300&fit=crop",
        title: "UFC megafight: Date confirmed for biggest heavyweight rematch in a decade",
        time: "6 hours ago",
      },
    ],

    celebrityArticles: [
      {
        img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
        title: `EXCLUSIVE: Taylor Swift confirms surprise concert at ${city} stadium with emotional Instagram post`,
        summary: `The superstar broke down in tears as she announced her return to ${city} for a record-breaking third sold-out show.`,
        time: "30 min ago",
      },
      {
        img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=300&fit=crop",
        title: "Dancing With The Stars 2026: First contestants revealed — and fans are divided",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
        title: "Netflix smash hit breaks all-time streaming record with 200 million views in first week",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop",
        title: `Kardashian family's new documentary sparks controversy after filming scenes in ${city}`,
        time: "4 hours ago",
      },
    ],

    lifestyleArticles: [
      {
        img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop",
        title: `The $6 meal deal at this ${city} diner that celebrity chefs say beats any restaurant`,
        summary: `We asked Michelin-starred chefs to blind taste local favorites — and the results from ${city} might shock you.`,
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        title: "Doctor reveals the 5-minute morning routine that could add years to your life",
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        title: `${state}'s best BBQ joints revealed — is YOUR favorite on the list?`,
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop",
        title: `The secret ${state} vacation spot that tourists haven't discovered yet`,
        time: "5 hours ago",
      },
    ],

    opinionArticles: [
      {
        img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&h=500&fit=crop",
        title: `${state} is sleepwalking into a pension catastrophe — and nobody in power seems to care`,
        summary: `Unless we act now, millions of ${state} workers face a retirement of grinding poverty, writes Mike Henderson.`,
        time: "2 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=300&fit=crop",
        title: "Stop blaming social media for everything wrong with our children",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=300&fit=crop",
        title: "Student loan forgiveness is an unfair tax on working Americans — it's time to end it",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=400&h=300&fit=crop",
        title: `I moved to ${city} five years ago — and I'd do it again in a heartbeat. Here's why.`,
        time: "6 hours ago",
      },
    ],

    exclusives: [
      {
        img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800&h=500&fit=crop",
        title: `EXCLUSIVE: Inside the secretive ${city} club where ${state} power brokers make backroom deals`,
        summary: `A ${name} investigation reveals the private establishment where political and business elites gather away from public scrutiny.`,
        time: "4 hours ago",
        tag: "Investigation",
      },
      {
        img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&h=400&fit=crop",
        title: `REVEALED: ${state} officials covered up scale of toxic contamination in public water supply`,
        summary: "Leaked documents show dangerous chemical levels were kept from residents for over two years.",
        time: "6 hours ago",
        tag: "Exclusive",
      },
      {
        img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop",
        title: `The hidden landlords: How anonymous LLCs own 30,000 homes across ${state}`,
        summary: `Our data investigation tracks the shell company ownership trail behind ${state}'s housing crisis.`,
        time: "8 hours ago",
        tag: "Data Investigation",
      },
    ],

    videos: [
      {
        img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=400&fit=crop",
        title: `Watch: Dramatic rescue as flash floods sweep through ${state} communities`,
        duration: "2:34",
        time: "1 hour ago",
      },
      {
        img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
        title: `Analysis: What the new ${state} budget means for YOUR wallet`,
        duration: "5:12",
        time: "3 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
        title: `Highlights: ${city}'s NFL team vs Dallas Cowboys — Week 14`,
        duration: "8:45",
        time: "5 hours ago",
      },
      {
        img: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&h=400&fit=crop",
        title: `Behind the scenes: New blockbuster filming on location in ${city}`,
        duration: "3:20",
        time: "6 hours ago",
      },
    ],

    columnists: [
      {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        name: "Mike Henderson",
        role: "Political Editor",
        title: `The Governor's days are numbered — and everyone in ${city} knows it`,
      },
      {
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        name: "Jessica Carter",
        role: "Economics Correspondent",
        title: `Stop blaming millennials — the ${state} housing crisis was caused by our generation`,
      },
      {
        img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        name: "Tom Williams",
        role: "Sports Columnist",
        title: "American football has sold its soul — and the fans are paying the price",
      },
      {
        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
        name: "Rachel Davis",
        role: "Culture Critic",
        title: `Why ${state}'s obsession with growth is destroying what made it special`,
      },
    ],
  };
}
