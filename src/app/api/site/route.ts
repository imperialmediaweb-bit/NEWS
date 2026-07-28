import { NextRequest, NextResponse } from "next/server";
import { sites, getActiveSite, getSiteByDomain } from "@/config/sites";
import { getHomepageArticles } from "@/lib/homepage-data";

// Cache responses for 5 minutes on CDN, revalidate on demand
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "";
  const slug = searchParams.get("slug") || "";

  let siteConfig = slug ? sites[slug] : getSiteByDomain(domain);
  if (!siteConfig) siteConfig = getActiveSite();

  const articles = await getHomepageArticles(siteConfig);

  return NextResponse.json(
    {
      site: siteConfig,
      articles,
      totalArticles: articles?.latestPosts?.length ?? 0,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, max-age=300",
      },
    }
  );
}
