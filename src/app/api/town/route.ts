import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { PLACES } from "@/lib/pipeline/relevance";
import { STATE_CITIES } from "@/lib/pipeline/google-news";

/** "Your town": the state's towns to choose from, and the latest stories naming the chosen one. */
export const dynamic = "force-dynamic";
const title = (x: string) => x.replace(/\b\w/g, (c) => c.toUpperCase());

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ towns: [] });
  const towns = Array.from(new Set((STATE_CITIES[site.state] || []).concat((PLACES[site.state] || []).map(title)))).sort();
  const town = req.nextUrl.searchParams.get("town") || "";
  if (!town || !towns.includes(town)) return NextResponse.json({ towns });
  const { rows } = await pool.query(
    `SELECT a.title, a.slug, a.category FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.title ~* $2 AND a.published_at > now() - interval '30 days' ORDER BY a.published_at DESC LIMIT 5`,
    [site.slug, `\\m${town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\M`]
  );
  return NextResponse.json({ towns, town, stories: rows }, { headers: { "Cache-Control": "public, s-maxage=600" } });
}
