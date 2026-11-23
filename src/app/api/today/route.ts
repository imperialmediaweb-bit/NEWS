import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { getStateWeather, getAllStateAlerts } from "@/lib/local-data";

/** "Today in {State}": weather in the main city, the top alert and five headlines. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({});
  const [wx, alerts, { rows }] = await Promise.all([
    getStateWeather(site.state).catch(() => []),
    getAllStateAlerts(site.stateAbbr).catch(() => null),
    pool.query(
      `SELECT a.title, a.slug, a.category FROM articles a JOIN sites s ON s.id = a.site_id
        WHERE s.slug = $1 AND a.published_at > now() - interval '24 hours' ORDER BY (a.category = 'local-news') DESC, a.published_at DESC LIMIT 5`,
      [site.slug]
    ),
  ]);
  const w = wx[0];
  return NextResponse.json(
    { state: site.state, weather: w ? { city: w.city, temp: w.temp, short: w.short } : null, alert: alerts?.[0] ? { event: alerts[0].event } : null, stories: rows },
    { headers: { "Cache-Control": "public, s-maxage=600" } }
  );
}
