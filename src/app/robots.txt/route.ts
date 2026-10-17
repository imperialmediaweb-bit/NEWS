import { NextRequest, NextResponse } from "next/server";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { DECLARED_BLOCKED_CRAWLERS } from "@/config/crawlers";

export const dynamic = "force-dynamic";

/**
 * robots.txt — multi-tenant aware.
 * Reads the request host so each domain points to ITS OWN sitemaps.
 */
export async function GET(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const baseUrl = `https://${site.domain}`;

  // Declare the crawlers the middleware refuses. Saying "Allow: /" to an
  // agent and then answering it 403 reads as a broken site rather than a
  // closed door — see src/config/crawlers.ts.
  const declined = DECLARED_BLOCKED_CRAWLERS.map(
    (agent) => `User-agent: ${agent}\nDisallow: /`
  ).join("\n\n");

  const text = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /report/

${declined}

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/news-sitemap.xml
Sitemap: ${baseUrl}/sitemap_index.xml
`;

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, max-age=86400",
    },
  });
}
