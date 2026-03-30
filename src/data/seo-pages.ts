import { sites } from "@/config/sites";

export interface SeoPageConfig {
  topicSlug: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
}

export interface StateSeoConfig {
  siteSlug: string;
  stateSlug: string;
  city: string;
  state: string;
  stateAbbr: string;
  domain: string;
  pages: SeoPageConfig[];
}

const topicTemplates: Array<{
  slugTemplate: (city: string) => string;
  titleTemplate: (city: string, state: string, abbr: string) => string;
  descriptionTemplate: (city: string, state: string) => string;
  h1Template: (city: string, state: string) => string;
  keywordsTemplate: (city: string, state: string, abbr: string) => string[];
}> = [
  {
    slugTemplate: (city) => `${city.toLowerCase().replace(/\s+/g, "-")}-news`,
    titleTemplate: (city, state, abbr) =>
      `${city} News Today | Latest ${city}, ${abbr} Headlines & Breaking News`,
    descriptionTemplate: (city, state) =>
      `Get the latest ${city}, ${state} news. Breaking stories, local headlines, investigations, and community updates from ${city} and surrounding areas.`,
    h1Template: (city, state) => `Latest ${city} News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} news`,
      `${city} ${abbr} news`,
      `${city} breaking news`,
      `${state} local news`,
      `${city} headlines today`,
      `${city} news today`,
    ],
  },
  {
    slugTemplate: () => "weather-forecast",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Weather Forecast | ${state} Weather Updates & Alerts`,
    descriptionTemplate: (city, state) =>
      `Current weather forecast for ${city}, ${state}. Get hourly and 7-day forecasts, severe weather alerts, storm tracking, and weather news for ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Latest Weather Forecast News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} weather`,
      `${city} ${abbr} weather forecast`,
      `${state} weather alerts`,
      `${city} weather today`,
      `${state} storm updates`,
      `${city} severe weather`,
    ],
  },
  {
    slugTemplate: () => "crime-reports",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Crime Reports | ${state} Crime News & Police Updates`,
    descriptionTemplate: (city, state) =>
      `Latest crime reports and police news from ${city}, ${state}. Arrests, investigations, court cases, and public safety updates from ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Latest Crime Reports from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} crime`,
      `${city} ${abbr} crime reports`,
      `${state} crime news`,
      `${city} police reports`,
      `${city} arrests`,
      `${state} public safety`,
    ],
  },
  {
    slugTemplate: () => "high-school-football",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} High School Football | ${state} HS Football Scores & News`,
    descriptionTemplate: (city, state) =>
      `High school football scores, standings, and news from ${city}, ${state}. Friday night football coverage, player highlights, and playoff updates across ${state}.`,
    h1Template: (city, state) =>
      `Latest High School Football News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} high school football`,
      `${abbr} high school football scores`,
      `${state} HS football`,
      `${city} football scores`,
      `${state} high school football rankings`,
      `${city} Friday night football`,
    ],
  },
  {
    slugTemplate: () => "real-estate-market",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Real Estate Market | ${state} Housing Prices & Trends`,
    descriptionTemplate: (city, state) =>
      `${city}, ${state} real estate market news and trends. Home prices, housing market reports, new developments, and property news from ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Latest Real Estate Market News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} real estate`,
      `${city} ${abbr} housing market`,
      `${state} home prices`,
      `${city} real estate market`,
      `${city} homes for sale news`,
      `${state} housing trends`,
    ],
  },
  {
    slugTemplate: () => "lottery-results",
    titleTemplate: (city, state, abbr) =>
      `${state} Lottery Results | ${city}, ${abbr} Winning Numbers & Jackpots`,
    descriptionTemplate: (city, state) =>
      `Latest ${state} lottery results and winning numbers. Powerball, Mega Millions, and ${state} state lottery results, jackpot amounts, and winner stories from ${city}.`,
    h1Template: (city, state) =>
      `Latest Lottery Results from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${state} lottery results`,
      `${city} ${abbr} lottery`,
      `${state} winning numbers`,
      `${state} Powerball results`,
      `${state} Mega Millions`,
      `${city} lottery winners`,
    ],
  },
  {
    slugTemplate: () => "job-market",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Job Market | ${state} Employment News & Hiring Trends`,
    descriptionTemplate: (city, state) =>
      `${city}, ${state} job market news and employment trends. Hiring updates, layoffs, new employers, unemployment data, and career news from ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Latest Job Market News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} jobs`,
      `${city} ${abbr} job market`,
      `${state} employment news`,
      `${city} hiring`,
      `${state} unemployment rate`,
      `${city} careers`,
    ],
  },
  {
    slugTemplate: () => "traffic-updates",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Traffic Updates | ${state} Road Conditions & Accidents`,
    descriptionTemplate: (city, state) =>
      `Live traffic updates for ${city}, ${state}. Road closures, accident reports, construction zones, and commute times for ${city} and surrounding ${state} areas.`,
    h1Template: (city, state) =>
      `Latest Traffic Updates from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} traffic`,
      `${city} ${abbr} traffic updates`,
      `${state} road conditions`,
      `${city} accidents today`,
      `${city} road closures`,
      `${state} traffic news`,
    ],
  },
  {
    slugTemplate: () => "school-closings",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} School Closings | ${state} School Delays & Cancellations`,
    descriptionTemplate: (city, state) =>
      `${city}, ${state} school closings, delays, and cancellations. Weather-related closures, early dismissals, and education news from ${city} and ${state} schools.`,
    h1Template: (city, state) =>
      `Latest School Closings from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} school closings`,
      `${city} ${abbr} school delays`,
      `${state} school cancellations`,
      `${city} school closures today`,
      `${state} school closings today`,
      `${city} education news`,
    ],
  },
  {
    slugTemplate: () => "gas-prices",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Gas Prices | ${state} Fuel Costs & Price Trends`,
    descriptionTemplate: (city, state) =>
      `Current gas prices in ${city}, ${state}. Find the cheapest gas stations, fuel price trends, and energy news affecting gas prices in ${city} and across ${state}.`,
    h1Template: (city, state) =>
      `Latest Gas Prices News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} gas prices`,
      `${city} ${abbr} gas prices`,
      `${state} fuel prices`,
      `${city} cheap gas`,
      `${state} gas price average`,
      `${city} gas stations`,
    ],
  },
  // ─── NEW HIGH-TRAFFIC TOPICS ───
  {
    slugTemplate: () => "restaurants",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Restaurant News | Best Restaurants, Openings & Reviews in ${state}`,
    descriptionTemplate: (city, state) =>
      `Restaurant news from ${city}, ${state}. New openings, closings, reviews, food scene updates, and dining guides for ${city} and across ${state}.`,
    h1Template: (city, state) =>
      `Restaurant News & Dining Updates in ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} restaurants`,
      `${city} ${abbr} restaurant news`,
      `${state} new restaurants`,
      `${city} best restaurants`,
      `${city} restaurant openings`,
      `${city} food news`,
    ],
  },
  {
    slugTemplate: () => "cost-of-living",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Cost of Living | ${state} Housing, Taxes & Living Expenses`,
    descriptionTemplate: (city, state) =>
      `Cost of living in ${city}, ${state}. Housing costs, tax rates, utilities, groceries, and affordability reports for ${city} and ${state} residents.`,
    h1Template: (city, state) =>
      `Cost of Living Updates in ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} cost of living`,
      `${city} ${abbr} cost of living`,
      `${state} affordable cities`,
      `${city} housing costs`,
      `${state} tax rates`,
      `${city} living expenses`,
    ],
  },
  {
    slugTemplate: () => "election-results",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Election Results | ${state} Voting, Polls & Political News`,
    descriptionTemplate: (city, state) =>
      `Election results and political news from ${city}, ${state}. Voting results, candidate profiles, polls, ballot measures, and political analysis for ${state}.`,
    h1Template: (city, state) =>
      `Election Results & Political News in ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} election results`,
      `${state} election results`,
      `${abbr} voting results`,
      `${state} polls`,
      `${city} candidates`,
      `${state} ballot measures`,
    ],
  },
  {
    slugTemplate: () => "obituaries",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Obituaries | ${state} Death Notices & Memorials`,
    descriptionTemplate: (city, state) =>
      `Obituaries and death notices from ${city}, ${state}. Read memorials, funeral information, and tributes for ${city} and ${state} community members.`,
    h1Template: (city, state) =>
      `Obituaries & Memorials from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} obituaries`,
      `${city} ${abbr} obituaries`,
      `${state} death notices`,
      `${city} funeral notices`,
      `${state} obituaries today`,
      `${city} memorials`,
    ],
  },
  {
    slugTemplate: () => "power-outages",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Power Outages | ${state} Outage Map & Utility Updates`,
    descriptionTemplate: (city, state) =>
      `Power outage updates for ${city}, ${state}. Current outage reports, restoration times, utility company updates, and storm damage reports for ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Power Outage Updates in ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} power outage`,
      `${city} ${abbr} power outage`,
      `${state} outage map`,
      `${city} electricity outage`,
      `${state} utility outage`,
      `${city} outage update`,
    ],
  },
  {
    slugTemplate: () => "car-accidents",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Car Accidents | ${state} Crash Reports & Road Safety News`,
    descriptionTemplate: (city, state) =>
      `Car accident reports from ${city}, ${state}. Crash updates, road safety news, DUI reports, fatal accidents, and highway incident coverage in ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Car Accident Reports from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} car accident`,
      `${city} ${abbr} car accidents`,
      `${state} crash reports`,
      `${city} accident today`,
      `${state} road accidents`,
      `${city} fatal crash`,
    ],
  },
  {
    slugTemplate: () => "business-news",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Business News | ${state} Economy, Companies & Startups`,
    descriptionTemplate: (city, state) =>
      `Business news from ${city}, ${state}. Local economy updates, new businesses, company expansions, layoffs, startups, and economic development in ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Business & Economy News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} business news`,
      `${city} ${abbr} business`,
      `${state} economy`,
      `${city} companies`,
      `${state} startups`,
      `${city} economic development`,
    ],
  },
  {
    slugTemplate: () => "court-cases",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Court Cases | ${state} Legal News, Trials & Verdicts`,
    descriptionTemplate: (city, state) =>
      `Court cases and legal news from ${city}, ${state}. Trial coverage, verdicts, sentencing, lawsuits, and justice system updates from ${city} and ${state} courts.`,
    h1Template: (city, state) =>
      `Court Cases & Legal News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} court cases`,
      `${city} ${abbr} court news`,
      `${state} trials`,
      `${city} verdicts`,
      `${state} legal news`,
      `${city} lawsuits`,
    ],
  },
  {
    slugTemplate: () => "health-news",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Health News | ${state} Healthcare, Hospitals & Public Health`,
    descriptionTemplate: (city, state) =>
      `Health news from ${city}, ${state}. Hospital updates, public health alerts, healthcare policy, disease outbreaks, and wellness news for ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Health & Hospital News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} health news`,
      `${city} ${abbr} hospital news`,
      `${state} public health`,
      `${city} healthcare`,
      `${state} health alerts`,
      `${city} hospital updates`,
    ],
  },
  {
    slugTemplate: () => "education-news",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Education News | ${state} Schools, Colleges & Education Policy`,
    descriptionTemplate: (city, state) =>
      `Education news from ${city}, ${state}. School district updates, university news, education policy, test scores, and teacher news from ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Education News from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} education news`,
      `${city} ${abbr} schools`,
      `${state} education`,
      `${city} school district`,
      `${state} college news`,
      `${city} school board`,
    ],
  },
  {
    slugTemplate: () => "fire-news",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Fire News | ${state} Wildfires, House Fires & Fire Department Updates`,
    descriptionTemplate: (city, state) =>
      `Fire news from ${city}, ${state}. Wildfire updates, house fire reports, fire department responses, arson investigations, and fire safety news for ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Fire News & Updates from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} fire`,
      `${city} ${abbr} fire news`,
      `${state} wildfires`,
      `${city} house fire`,
      `${state} fire department`,
      `${city} fire today`,
    ],
  },
  {
    slugTemplate: () => "missing-persons",
    titleTemplate: (city, state, abbr) =>
      `${city}, ${abbr} Missing Persons | ${state} Missing People & Amber Alerts`,
    descriptionTemplate: (city, state) =>
      `Missing persons reports from ${city}, ${state}. Active missing person cases, Amber Alerts, Silver Alerts, and search updates from ${city} and ${state}.`,
    h1Template: (city, state) =>
      `Missing Persons Reports from ${city}, ${state}`,
    keywordsTemplate: (city, state, abbr) => [
      `${city} missing person`,
      `${city} ${abbr} missing persons`,
      `${state} amber alert`,
      `${city} missing people`,
      `${state} silver alert`,
      `${city} missing child`,
    ],
  },
];

function buildStateSeoConfig(
  siteSlug: string,
  city: string,
  state: string,
  stateAbbr: string,
  domain: string
): StateSeoConfig {
  const stateSlug = state.toLowerCase().replace(/\s+/g, "-");
  const pages: SeoPageConfig[] = topicTemplates.map((t) => ({
    topicSlug: t.slugTemplate(city),
    title: t.titleTemplate(city, state, stateAbbr),
    description: t.descriptionTemplate(city, state),
    h1: t.h1Template(city, state),
    keywords: t.keywordsTemplate(city, state, stateAbbr),
  }));

  return { siteSlug, stateSlug, city, state, stateAbbr, domain, pages };
}

export const seoPages: StateSeoConfig[] = Object.values(sites).map((s) =>
  buildStateSeoConfig(s.slug, s.city, s.state, s.stateAbbr, s.domain)
);

export function getSeoPageConfig(
  stateSlug: string,
  topicSlug: string
): { state: StateSeoConfig; page: SeoPageConfig } | null {
  const state = seoPages.find((s) => s.stateSlug === stateSlug);
  if (!state) return null;
  const page = state.pages.find((p) => p.topicSlug === topicSlug);
  if (!page) return null;
  return { state, page };
}

export function getAllSeoSlugs(): Array<{ state: string; topic: string }> {
  const slugs: Array<{ state: string; topic: string }> = [];
  for (const s of seoPages) {
    for (const p of s.pages) {
      slugs.push({ state: s.stateSlug, topic: p.topicSlug });
    }
  }
  return slugs;
}
