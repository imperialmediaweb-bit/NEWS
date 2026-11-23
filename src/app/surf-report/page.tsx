import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { getBuoys, getVolcanoStatus } from "@/lib/local-data";

export const dynamic = "force-dynamic";
const STATES = ["HI"];

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) return {};
  return { title: "Hawaii Surf Report Today: Wave Heights by Buoy", description: "Hawaii surf report today: wave height, swell period and water temperature from NOAA buoys off Oahu, Maui and the Big Island, plus Kilauea volcano status.", alternates: { canonical: `https://${site.domain}/surf-report` } };
}

export default async function SurfReportPage() {
  const site = siteFromHeaders();
  if (!STATES.includes(site.stateAbbr)) notFound();
  const [buoys, volcano] = await Promise.all([getBuoys([["51201", "Waimea Bay, Oahu North Shore"], ["51202", "Mokapu Point, Oahu"], ["51205", "Pauwela, Maui"], ["51206", "Hilo, Big Island"]]).catch(() => null), getVolcanoStatus("332010").catch(() => null)]); const b = (buoys || []).filter((x) => x.waveFt != null); const big = [...b].sort((x, y) => (y.waveFt || 0) - (x.waveFt || 0))[0];
  return (
    <SpecialPage site={site} path="/surf-report" h1={"Hawaii Surf Report Today: Wave Heights by Buoy".replace(/:.*$/, "")} answer={big ? `The biggest waves right now are at ${big.name}: ${big.waveFt} feet${big.periodS ? ` with a ${big.periodS}-second period` : ""}${big.waterF ? `, water ${big.waterF}°F` : ""}.${volcano ? ` Kilauea: ${volcano.level.toLowerCase()} (${volcano.color.toLowerCase()}).` : ""}` : "Buoy readings are not available right now; check back shortly."} storiesTitle={"Hawaii ocean and volcano news"} storiesPattern={"(surf|high surf|waves|swell|beach|kilauea|volcano|eruption|lava)"} faqs={[["How big are the waves in Hawaii today?", big ? `Up to ${big.waveFt} feet at ${big.name}.` : "Readings are updating."], ["What is a high surf advisory?", "A National Weather Service notice when breaking waves are expected to be dangerous; stay out of the water when it is in effect."], ["Is Kilauea erupting?", volcano ? `USGS lists Kilauea at ${volcano.level} (${volcano.color}).` : "Check the USGS Hawaiian Volcano Observatory."]] as [string, string][]} source={"Source: NOAA National Data Buoy Center, USGS Hawaiian Volcano Observatory"}>
      {b.length ? <Table head={["Buoy", "Waves", "Period", "Water"]} rows={b.map((x) => [x.name, `${x.waveFt} ft`, x.periodS ? `${x.periodS} s` : "—", x.waterF ? `${x.waterF}°F` : "—"])} /> : null}
    </SpecialPage>
  );
}
