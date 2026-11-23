import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { getAllStateAlerts } from "@/lib/local-data";

/** The most serious active NWS warning for this site's state, for the site-wide alert ticker. */
export const dynamic = "force-dynamic";
const SERIOUS = /(tornado warning|hurricane warning|tropical storm warning|blizzard warning|ice storm warning|flash flood warning|tsunami warning|extreme heat warning|excessive heat warning|red flag warning|winter storm warning|storm surge warning|extreme wind warning|evacuation)/i;

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ alerts: [] });
  const all = (await getAllStateAlerts(site.stateAbbr).catch(() => null)) || [];
  const alerts = all.filter((a) => SERIOUS.test(a.event)).slice(0, 4).map((a) => ({ event: a.event, area: a.area.split(", ").slice(0, 4).join(", ") }));
  return NextResponse.json({ alerts }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
