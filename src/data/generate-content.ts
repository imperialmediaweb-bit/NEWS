import { SiteConfig } from "@/config/site-config";

export interface Article {
  img: string;
  title: string;
  summary?: string;
  category: string;
  date: string;
  author?: string;
  time?: string;
  slug?: string;
}

export interface SiteContent {
  heroMain: Article;
  heroSide: Article[];
  trending: Article[];
  popular: Article[];
  localNews: Article[];
  usNews: Article[];
  worldNews: Article[];
  politics: Article[];
  technology: Article[];
  sports: Article[];
  entertainment: Article[];
  business: Article[];
  opinion: Article[];
  showcase: Article[];
  celebrity: Article[];
  featuredStory: Article;
  featuredStory2: Article;
  latestPosts: Article[];
  sidebarLatest: Article[];
  sidebarNewsletter: { title: string; description: string };
  footerAbout: string;
}

export function generateContent(site: SiteConfig): SiteContent {
  const { city, state, name } = site;

  return {
    heroMain: {
      img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop",
      title: `${state} Governor Faces Calls to Resign as Federal Corruption Probe Reaches Inner Circle`,
      summary: `Senior aides are reported to be cooperating with federal investigators tonight as the scandal engulfing the ${state} Governor's office deepens, with calls for resignation now coming from within the Governor's own party.`,
      category: "Breaking News",
      date: "March 27, 2026",
      author: "Mike Henderson",
    },
    heroSide: [
      {
        img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
        title: `${city} Housing Market Crashes 15% in Worst Quarter Since 2008`,
        category: "Business",
        date: "March 27, 2026",
      },
      {
        img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=600&fit=crop",
        title: `${city}'s NFL Team Agrees to Blockbuster $120M Trade Deal`,
        category: "Sports",
        date: "March 27, 2026",
      },
      {
        img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
        title: `Taylor Swift Confirms Surprise Concert at ${city} Stadium`,
        category: "Entertainment",
        date: "March 26, 2026",
      },
    ],
    trending: [
      { img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=200&h=150&fit=crop", title: `${city} teacher arrested after messages to student surface`, category: "Crime", date: "2h ago" },
      { img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=150&fit=crop", title: `Save $5,000 on your ${state} property taxes with this loophole`, category: "Money", date: "3h ago" },
      { img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=200&h=150&fit=crop", title: `${city} Council spends $3M on bike lanes nobody uses`, category: "Local", date: "4h ago" },
      { img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=200&h=150&fit=crop", title: `Inside the $12M mansion where reality star threw wild party`, category: "Celebrity", date: "5h ago" },
      { img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=200&h=150&fit=crop", title: `Mom wins $75,000 after Walmart humiliated her at ${city} store`, category: "News", date: "6h ago" },
      { img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=200&h=150&fit=crop", title: `${state} hospital ER wait times hit record 9 hours`, category: "Health", date: "7h ago" },
    ],
    popular: [
      { img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=300&h=200&fit=crop", title: `${city} teacher arrested after scandal surfaces`, category: "Crime", date: "2h ago" },
      { img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop", title: `Save $5K on ${state} taxes with this loophole`, category: "Money", date: "3h ago" },
      { img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=300&h=200&fit=crop", title: `${city} spends $3M on bike lanes nobody uses`, category: "Local", date: "4h ago" },
      { img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=300&h=200&fit=crop", title: `Inside the $12M mansion party that ended in arrests`, category: "Celebrity", date: "5h ago" },
      { img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=300&h=200&fit=crop", title: `Mom wins $75K after Walmart humiliation in ${city}`, category: "News", date: "6h ago" },
      { img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300&h=200&fit=crop", title: `${state} ER wait times hit 9 hours`, category: "Health", date: "7h ago" },
    ],
    showcase: [
      { img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop", title: `The ${city} restaurant that just won America's best diner award`, category: "Showcase", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=200&fit=crop", title: `The secret ${state} vacation spot tourists haven't found`, category: "Travel", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop", title: `$6 meal deal celebrity chefs say beats any restaurant`, category: "Food", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=200&fit=crop", title: `${city}'s hidden gem restaurants locals don't want you to know`, category: "Food", date: "March 25, 2026" },
    ],
    celebrity: [
      { img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop", title: `Kardashian documentary sparks controversy in ${city}`, category: "Celebrity", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=300&h=200&fit=crop", title: `DWTS 2026: first celebrity contestants revealed`, category: "TV", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=200&fit=crop", title: `Netflix hit breaks all-time streaming record`, category: "Streaming", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=300&h=200&fit=crop", title: `Reality star's $12M ${city} party ends with police`, category: "Celebrity", date: "March 25, 2026" },
    ],
    localNews: [
      { img: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&h=600&fit=crop", title: `Major Transit Strike to Paralyze ${city} as Union Rejects Pay Offer`, summary: `Commuters face chaos as three unions announce coordinated walkout affecting every route in the ${city} metro area.`, category: "Local News", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=600&h=400&fit=crop", title: `Gun Violence Crackdown: 150 Arrests in Major ${city} Operation`, category: "Crime", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", title: `Parents Furious as ${city} School Bans Packed Lunches`, category: "Education", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=400&fit=crop", title: `Dramatic Footage Shows Roof Collapse at Major ${city} Mall`, category: "Local News", date: "March 26, 2026" },
    ],
    usNews: [
      { img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=800&h=600&fit=crop", title: "Congress Deadlocked on Immigration Bill as Government Shutdown Looms", summary: "House Speaker warns both parties that time is running out to reach a deal before the Friday deadline.", category: "US News", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop", title: "Supreme Court Takes Up Landmark Second Amendment Case", category: "US News", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=600&h=400&fit=crop", title: "CDC Report Reveals Alarming Rise in Antibiotic-Resistant Infections", category: "Health", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=400&fit=crop", title: "Social Security Age Could Rise to 70 Under New Proposal", category: "Policy", date: "March 26, 2026" },
    ],
    worldNews: [
      { img: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=600&fit=crop", title: "Earthquake Devastation: Thousands Feared Dead After 7.8 Magnitude Quake Strikes Turkey", summary: "Rescue teams from 30 countries scramble to reach survivors trapped under collapsed buildings.", category: "World", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=600&h=400&fit=crop", title: "US-China Tensions Soar as Naval Standoff Erupts in South China Sea", category: "World", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&h=400&fit=crop", title: "Australian Wildfires Force Mass Evacuation of 100,000 Near Sydney", category: "World", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=600&h=400&fit=crop", title: "North Korea Launches Missile Over Japan in Provocative Test", category: "World", date: "March 26, 2026" },
    ],
    politics: [
      { img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=600&fit=crop", title: `${state} Senator Under Fire as Leaked Memo Reveals Secret Tax Hike Plan`, summary: `Opposition demands urgent hearing after document surfaces showing officials modeled massive tax hikes without public input.`, category: "Politics", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1575540325276-4ddaa4a89809?w=600&h=400&fit=crop", title: `${city} Mayor Defects From Party Over Immigration Stance`, category: "Politics", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop", title: `Former ${state} Governor's Memoir: 'I Nearly Resigned Over Scandal'`, category: "Politics", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=600&h=400&fit=crop", title: `New Poll Shows ${state} Voters Shifting on Key Ballot Measure`, category: "Politics", date: "March 26, 2026" },
    ],
    technology: [
      { img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop", title: "Apple Announces Revolutionary AI Features Coming to iPhone 18 This Fall", summary: "The tech giant unveiled its most ambitious AI integration yet at a special event in Cupertino.", category: "Technology", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&h=400&fit=crop", title: "SpaceX Completes Historic Mission With Record Payload", category: "Space", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop", title: "Electric Vehicle Sales Surge 40% as Battery Tech Cuts Costs", category: "Auto", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&h=400&fit=crop", title: "New Cybersecurity Threats Target Millions of Home Routers", category: "Security", date: "March 26, 2026" },
    ],
    sports: [
      { img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=600&fit=crop", title: `TRADE BOMBSHELL: ${city}'s NFL Team Agrees to Blockbuster $120M Deal for Superstar`, summary: "Front office officials have beaten three other franchises to land the most sought-after player in the league.", category: "NFL", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop", title: `MLB Drama: ${state}'s Team Collapses in Humiliating Playoff Loss`, category: "MLB", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop", title: `March Madness: ${state} College Pulls Off Stunning Upset`, category: "NCAA", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=400&fit=crop", title: "NASCAR Star Hints at Shock Retirement After Disastrous Race", category: "NASCAR", date: "March 26, 2026" },
    ],
    entertainment: [
      { img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop", title: `Taylor Swift Confirms Surprise Concert at ${city} Stadium — Fans Scramble for Tickets`, summary: `The pop megastar stunned fans with a social media post confirming a previously unannounced stop in ${city} during her record-breaking tour.`, category: "Entertainment", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop", title: "Dancing With The Stars 2026: First Celebrity Contestants Officially Revealed", category: "TV", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop", title: "Netflix Smash Hit Breaks All-Time Streaming Record With 200M Views in One Week", category: "Streaming", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1594394874895-f484d5c5e88a?w=600&h=400&fit=crop", title: `Reality Star's $12M ${city} Mansion Party Ends With Police, 3 Arrests`, category: "Celebrity", date: "March 26, 2026" },
    ],
    business: [
      { img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop", title: `Wall Street Panic: ${state} Pension Fund Loses $2 Billion in Market Rout`, summary: `State officials scramble as aggressive investment strategy backfires spectacularly amid market volatility.`, category: "Finance", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop", title: `${state} Property Tax Loophole Could Save Homeowners $5,000 a Year`, category: "Money", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop", title: "Gas Prices Set to Spike 30% This Summer, Analysts Warn", category: "Economy", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=400&fit=crop", title: `Amazon Opens Massive New Warehouse in ${city}, Creating 3,000 Jobs`, category: "Jobs", date: "March 26, 2026" },
    ],
    opinion: [
      { img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop", title: `${state} Deserves Better — Why Our Governor Must Go Now`, summary: `The time for half-measures is over. Our state needs leadership that puts people over politics.`, category: "Opinion", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop", title: "Stop Blaming Social Media for Everything Wrong With Kids Today", category: "Opinion", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=600&h=400&fit=crop", title: `I Moved to ${city} 5 Years Ago and I'd Do It Again in a Heartbeat`, category: "Column", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop", title: "The American Dream Isn't Dead — But Washington Is Killing It", category: "Opinion", date: "March 26, 2026" },
    ],
    featuredStory2: {
      img: "https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=1400&h=700&fit=crop",
      title: `BOMBSHELL: ${city} Police Chief Resigns After Body Camera Footage Leaks`,
      summary: `The 12-year veteran abruptly stepped down just hours after ${name} obtained explosive footage that contradicts official department statements about a controversial use-of-force incident last month.`,
      category: "Exclusive",
      date: "March 27, 2026",
      author: "David Chen, Crime & Justice Editor",
    },
    featuredStory: {
      img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1400&h=700&fit=crop",
      title: `EXCLUSIVE: Inside the Secretive ${city} Club Where ${state} Power Brokers Make Backroom Deals`,
      summary: `A ${name} investigation reveals the private establishment where political and business elites gather away from public scrutiny. Leaked documents show hundreds of secret meetings between lobbyists and elected officials over the past decade.`,
      category: "Investigation",
      date: "March 27, 2026",
      author: "Jessica Carter, Senior Investigative Reporter",
    },
    latestPosts: [
      { img: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop", title: `The ${city} Restaurant That Just Won America's Best Diner Award`, category: "Food", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop", title: `The $6 Meal Deal Celebrity Chefs Say Beats Any Restaurant`, category: "Lifestyle", date: "March 27, 2026" },
      { img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop", title: `The Secret ${state} Vacation Spot Tourists Haven't Found Yet`, category: "Travel", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop", title: "Doctor Reveals 5-Minute Morning Routine That Adds Years to Life", category: "Health", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop", title: "Dancing With The Stars 2026: First Contestants Revealed", category: "TV", date: "March 26, 2026" },
      { img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop", title: "Netflix Hit Breaks Streaming Record With 200M Views", category: "Streaming", date: "March 25, 2026" },
      { img: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=400&fit=crop", title: `Mom Wins $75,000 Lawsuit After Humiliating Walmart Incident in ${city}`, category: "News", date: "March 25, 2026" },
      { img: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&h=400&fit=crop", title: `${state} Hospital ER Wait Times Hit Record 9 Hours, Patients Outraged`, category: "Health", date: "March 25, 2026" },
      { img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=400&fit=crop", title: `${city} Marathon Runner Collapses at Finish Line, Saved by Spectator Nurse`, category: "Inspiring", date: "March 25, 2026" },
    ],
    sidebarLatest: [
      { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop", title: `${state}'s Best BBQ Joints — Is Yours on the List?`, category: "Food", date: "5h ago" },
      { img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=150&fit=crop", title: `Stop Blaming Social Media for Everything Wrong With Kids`, category: "Opinion", date: "6h ago" },
      { img: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=200&h=150&fit=crop", title: `I Moved to ${city} 5 Years Ago — I'd Do It Again`, category: "Opinion", date: "7h ago" },
      { img: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&h=150&fit=crop", title: `Kardashian Documentary Sparks Controversy in ${city}`, category: "Celebrity", date: "8h ago" },
      { img: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=200&h=150&fit=crop", title: `New Blockbuster Filming in Downtown ${city}`, category: "Entertainment", date: "9h ago" },
    ],
    sidebarNewsletter: {
      title: `Get ${name} Daily`,
      description: `${state}'s biggest stories delivered free every morning at 6am.`,
    },
    footerAbout: `${name} is ${state}'s premier source for breaking news, politics, sports, entertainment, and local stories. Our dedicated team of journalists covers the stories that matter most to ${state} residents, delivering accurate and timely reporting you can trust.`,
  };
}
