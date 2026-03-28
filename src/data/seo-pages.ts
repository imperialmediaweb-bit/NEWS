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
