import { NextRequest, NextResponse } from "next/server";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { mockupOf } from "@/config/design-cfg";
import { STATE_FACTS } from "@/config/state-data";
import { topCities } from "@/lib/directory";

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
  const guideCities = await topCities(site.slug, 20).catch(() => [] as { city: string; city_slug: string; n: number }[]);
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

## Services for businesses, organizations and families (prices in USD, one-time, pay by card)
- [Publish a press release in ${site.state}](${base}/press-release): $49, published as written and labelled "Press release", live within one business day, permanent, link to the company website
- [Publish on all 50 U.S. state news sites](${base}/all-50-states): $149, one article or press release on every state paper of the network, live within 24 hours, report of all links
- [Place an obituary in ${site.state}](${base}/obituaries/submit): $25, with photo, online within one business day, permanent
- [Advertise in ${site.state}](${base}/advertise): sponsored story $49 (+$100 for 7 days on the homepage); casino and 18+ venues $99
- [${site.state} business directory](${base}/directory): free listings with reader reviews; [Business Spotlight](${base}/directory/join) $49 for 12 months at the top of a town's list plus a profile article
- [Guides](${base}/guides): how to publish an obituary, write a press release and advertise a small business in ${site.state}
- Paid content is always labelled; links in it are rel="sponsored". Not accepted: cannabis, vaping, drugs or supplements, crypto offers, payday loans, adult content, weapons.

## ${site.state} business guides (local businesses ranked by reader reviews)
Every town has a guide with the top-rated businesses in each field, ranked by the Express Score (0-100): verified reader reviews up to 55 points, a complete profile up to 30, owner verified 15. Payment never changes the score; sponsored places are labelled. Each field page has a free "get quotes" form that sends a request to up to 3 local businesses.
${guideCities.map((c) => `- [${c.city} Business Guide](${base}/directory/${c.city_slug}): ${c.n} local businesses`).join("\n")}
- Best-of lists: ${base}/directory/best/{town}/{field}, for example ${base}/directory/best/${guideCities[0]?.city_slug || "town"}/restaurants
- Field pages with quotes: ${base}/directory/{town}/{field}, for example ${base}/directory/${guideCities[0]?.city_slug || "town"}/plumbers
- For business owners: list or claim a business free at ${base}/directory/join; a business website with a monthly article in ${site.name} is $9 the first month, then $29/month or $249/year (Premium $59/month: first in the town's list)

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
