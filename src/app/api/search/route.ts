import { NextRequest, NextResponse } from "next/server";
import { sites, getSiteByDomain, getActiveSite } from "@/config/sites";
import { searchArticles } from "@/lib/search";

export const dynamic = "force-dynamic";

/**
 * JSON search endpoint, for the header search box and anything else that wants
 * results without a page load. The /search page renders server-side and does
 * not depend on this route.
 *
 *   GET /api/search?q=flood&page=2
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") || "";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const slug = params.get("site");

  const host = request.headers.get("host") || "";
  const site = (slug ? sites[slug] : getSiteByDomain(host)) || getActiveSite();

  const result = await searchArticles(site, q, page);

  return NextResponse.json(
    { query: q, site: site.slug, ...result },
    {
      headers: {
        // Short CDN cache: repeated searches for the same term are common and
        // results only change when new articles publish.
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, max-age=120",
        Vary: "Host",
      },
    }
  );
}
