import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { getHomepageArticles } from "@/lib/homepage-data";
import HomeClient from "@/components/HomeClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { designState } from "@/lib/design-nou";
import { getStateWeather, getActiveStorms, countiesOf, getStateAlerts, getGasPrices, getLottery, getAirportStatus, getSpaceCoastLaunches, STATE_AIRPORTS, getStateQuakes, getStateFires, outlineOf } from "@/lib/local-data";
import { getCategoryArticles } from "@/lib/category-data";
import HomeLive from "@/components/design/live/HomeLive";
import HomePeach from "@/components/design/peach/HomePeach";
import HomeTabloid from "@/components/design/tabloid/HomeTabloid";
import HomeMagazine from "@/components/design/magazine/HomeMagazine";

// Multi-tenant: 50 domains share this route, so the page must resolve the
// site per-request from the Host header. Server-rendering the real articles
// here (instead of client-side fetching) means Googlebot and AdSense
// reviewers see the actual content in the initial HTML.
export const dynamic = "force-dynamic";

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    return getSiteByDomain(host) || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

type Props = { searchParams: { design?: string | string[] } };

// The preview of a new design (?design=nou) must never be indexed.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const site = getSiteFromHeaders();
  return designState(site.slug, searchParams.design).preview ? { robots: { index: false, follow: false } } : {};
}

export default async function Home({ searchParams }: Props) {
  const site = getSiteFromHeaders();
  const articles = await getHomepageArticles(site);
  const design = designState(site.slug, searchParams.design);

  // Honest empty state — never show fabricated placeholder news.
  if (!articles || !articles.heroMain) {
    const footerAbout = `${site.name} is ${site.city}'s source for breaking news, politics, entertainment, and local coverage across ${site.state}.`;
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header site={site} />
        <div className="max-w-[1300px] mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {site.name}
          </h1>
          <p className="text-gray-600">
            Our newsroom is preparing the latest {site.state} coverage. Please check back shortly.
          </p>
        </div>
        <Footer site={site} about={footerAbout} />
      </div>
    );
  }

  if (design.family) {
    const SECTIONS = ["politics", "sports", "business", "life"];
    const ports = STATE_AIRPORTS[site.state];
    const QUAKE_STATES = ["California", "Alaska", "Oregon", "Washington", "Wyoming", "Nevada", "Utah", "Idaho", "Montana", "Hawaii"];
    const FIRE_STATES = ["California", "Oregon", "Washington", "Idaho", "Montana", "Nevada", "Arizona", "New Mexico", "Colorado", "Utah", "Wyoming"];
    const [weather, storms, alerts, gas, lottery, airports, launches, quakes, fires, ...lists] = await Promise.all([
      getStateWeather(site.state),
      getActiveStorms(),
      getStateAlerts(site.stateAbbr),
      getGasPrices(site.state),
      getLottery(),
      ports ? getAirportStatus(ports) : Promise.resolve(null),
      site.state === "Florida" ? getSpaceCoastLaunches() : Promise.resolve(null),
      QUAKE_STATES.includes(site.state) ? getStateQuakes(site.state) : Promise.resolve(null),
      FIRE_STATES.includes(site.state) ? getStateFires(site.stateAbbr) : Promise.resolve(null),
      ...SECTIONS.map((c) => getCategoryArticles(site.slug, c, 1)),
    ]);
    const sections = Object.fromEntries(SECTIONS.map((c, i) => [c, (lists[i] as Awaited<ReturnType<typeof getCategoryArticles>>).articles]));
    const Home = { peach: HomePeach, tabloid: HomeTabloid, magazine: HomeMagazine, live: HomeLive }[design.family];
    return <Home site={site} articles={articles} weather={weather} storms={storms} counties={countiesOf(site.state)} sections={sections} alerts={alerts} gas={gas} lottery={lottery} airports={airports} launches={launches} quakes={quakes} fires={fires} outline={outlineOf(site.state)} />;
  }

  return <HomeClient site={site} articles={articles} />;
}
