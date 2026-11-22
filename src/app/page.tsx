import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { getHomepageArticles } from "@/lib/homepage-data";
import HomeClient from "@/components/HomeClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { designState } from "@/lib/design-nou";
import { getStateWeather, getActiveStorms, countiesOf, getStateAlerts, getGasPrices, getLottery, getAirportStatus, getSpaceCoastLaunches, airportsOf, getStateQuakes, getStateFires, outlineOf, getSubwayStatus, getVolcanoStatus, getBuoys, getUvHourly, getSnow, getDrought, getSignature } from "@/lib/local-data";
import { getCategoryArticles } from "@/lib/category-data";
import HomeLive from "@/components/design/live/HomeLive";
import HomePeach from "@/components/design/peach/HomePeach";
import HomeTabloid from "@/components/design/tabloid/HomeTabloid";
import HomeMagazine from "@/components/design/magazine/HomeMagazine";
import HomeBroadsheet from "@/components/design/broadsheet/HomeBroadsheet";
import HomeCoastal from "@/components/design/coastal/HomeCoastal";
import HomeDark from "@/components/design/dark/HomeDark";
import HomeWestern from "@/components/design/western/HomeWestern";
import HomeGazette from "@/components/design/gazette/HomeGazette";

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
    const ports = airportsOf(site.state);
    const QUAKE_STATES = ["California", "Alaska", "Oregon", "Washington", "Wyoming", "Nevada", "Utah", "Idaho", "Montana", "Hawaii"];
    const FIRE_STATES = ["California", "Oregon", "Washington", "Idaho", "Montana", "Nevada", "Arizona", "New Mexico", "Colorado", "Utah", "Wyoming"];
    const DROUGHT_FIPS: Record<string, string> = { Iowa: "19", Arkansas: "05", Indiana: "18", Kansas: "20", Mississippi: "28", Nebraska: "31", "North Dakota": "38", "South Dakota": "46", "West Virginia": "54", Wisconsin: "55" };
    const NO_LOTTERY = ["Alabama", "Alaska", "Hawaii", "Nevada", "Utah"];
    const [weather, storms, alerts, gas, lottery, airports, launches, quakes, fires, subway, volcanoes, buoys, uv, snow, drought, signature, ...lists] = await Promise.all([
      getStateWeather(site.state),
      getActiveStorms(),
      getStateAlerts(site.stateAbbr),
      getGasPrices(site.state),
      // Powerball and Mega Millions are not sold in five states
      NO_LOTTERY.includes(site.state) ? Promise.resolve(null) : getLottery(),
      ports ? getAirportStatus(ports) : Promise.resolve(null),
      site.state === "Florida" ? getSpaceCoastLaunches() : Promise.resolve(null),
      QUAKE_STATES.includes(site.state) ? getStateQuakes(site.state) : Promise.resolve(null),
      FIRE_STATES.includes(site.state) ? getStateFires(site.stateAbbr) : Promise.resolve(null),
      site.state === "New York" ? getSubwayStatus() : Promise.resolve(null),
      site.state === "Hawaii" ? Promise.all([getVolcanoStatus("332010"), getVolcanoStatus("332020")]).then((v) => v.filter((x): x is NonNullable<typeof x> => !!x)) : Promise.resolve(null),
      site.state === "Hawaii" ? getBuoys([["51201", "Waimea Bay, O‘ahu"], ["51202", "Mokapu Point, O‘ahu"], ["51206", "Hilo, Big Island"], ["51208", "Hanalei, Kaua‘i"], ["51205", "Pauwela, Maui"]]) : Promise.resolve(null),
      site.state === "Arizona" ? getUvHourly("Phoenix", "AZ") : Promise.resolve(null),
      site.state === "Montana" ? getSnow([["590:MT:SNTL", "Lone Mountain (Big Sky)"], ["480:MT:SNTL", "Fisher Creek (Beartooths)"], ["385:MT:SNTL", "Carrot Basin (West Yellowstone)"], ["696:MT:SNTL", "Placer Basin (Crazy Mtns)"], ["436:MT:SNTL", "Darkhorse Lake (Bitterroot)"]]) : Promise.resolve(null),
      DROUGHT_FIPS[site.state] ? getDrought(DROUGHT_FIPS[site.state]) : Promise.resolve(null),
      getSignature(site.state, site.stateAbbr).catch(() => null),
      ...SECTIONS.map((c) => getCategoryArticles(site.slug, c, 1)),
    ]);
    const sections = Object.fromEntries(SECTIONS.map((c, i) => [c, (lists[i] as Awaited<ReturnType<typeof getCategoryArticles>>).articles]));
    const Home = { peach: HomePeach, tabloid: HomeTabloid, magazine: HomeMagazine, broadsheet: HomeBroadsheet, coastal: HomeCoastal, dark: HomeDark, western: HomeWestern, gazette: HomeGazette, live: HomeLive }[design.family];
    return <Home site={site} articles={articles} weather={weather} storms={storms} counties={countiesOf(site.state)} sections={sections} alerts={alerts} gas={gas} lottery={lottery} airports={airports} launches={launches} quakes={quakes} fires={fires} outline={outlineOf(site.state)} subway={subway} volcanoes={volcanoes} buoys={buoys} uv={uv} snow={snow} drought={drought} signature={signature} />;
  }

  return <HomeClient site={site} articles={articles} />;
}
