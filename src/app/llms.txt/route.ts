import { NextRequest, NextResponse } from "next/server";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { mockupOf } from "@/config/design-cfg";
import { STATE_FACTS } from "@/config/state-data";

export const dynamic = "force-dynamic";

/**
 * /llms.txt — a plain guide for AI search assistants (ChatGPT, Perplexity,
 * Gemini, Copilot, Claude): who the site is, what it covers and where its
 * sections, sitemaps and policies are, so answers can cite the right pages.
 */
export async function GET(request: NextRequest) {
  const domain = (request.headers.get("host") || "").split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const base = `https://${site.domain}`;
  const m = mockupOf(site.slug);
  const facts = STATE_FACTS[site.state];
  const cities = facts ? facts.cities.map((c) => c[0]).join(", ") : site.city;
  const text = `# ${site.name}

> ${m?.slogan || site.tagline} ${site.name} is a statewide daily news site for ${site.state}: local news, politics, business, sports, weather and life from ${cities}, and the state's counties.

${site.name} publishes original reporting and summaries of verified local news about ${site.state}. Each article names its sources, carries a dateline, the author and the publication and update times. Weather, alerts, gas prices and other data come from official U.S. sources (National Weather Service, U.S. Energy Information Administration, USGS, NOAA) and are labelled as such.

## Sections
- [Local news](${base}/local-news): cities, towns and counties of ${site.state}
- [Politics](${base}/politics): the statehouse, the governor, Congress and elections
- [Business](${base}/business): jobs, companies and the economy
- [Sports](${base}/sports): pro, college and high school sports
- [Life](${base}/life): food, culture, events and the outdoors
- [Opinion](${base}/opinion): columns and editorials, clearly labelled

## For assistants and search
- [News sitemap, last 48 hours](${base}/news-sitemap.xml)
- [Full sitemap](${base}/sitemap.xml)
- [RSS feed](${base}/feed)

## Standards
- [About us](${base}/about)
- [Editorial policy](${base}/editorial-policy)
- [Ethics](${base}/ethics)
- [Corrections](${base}/corrections)
- [Contact the newsroom](${base}/contact)
`;
  return new NextResponse(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
