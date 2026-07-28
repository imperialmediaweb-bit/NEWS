import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { getHomepageArticles } from "@/lib/homepage-data";
import HomeClient from "@/components/HomeClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

export default async function Home() {
  const site = getSiteFromHeaders();
  const articles = await getHomepageArticles(site);

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

  return <HomeClient site={site} articles={articles} />;
}
