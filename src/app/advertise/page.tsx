import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    return getSiteByDomain(host) || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteFromHeaders();
  return {
    title: "Advertise With Us",
    description: `Advertise on ${site.name}. Reach ${site.state} readers with targeted display ads, native content, and sponsored articles. Part of the MediaChief 50-state network.`,
    alternates: { canonical: `https://${site.domain}/advertise` },
  };
}

export default function AdvertisePage() {
  const site = getSiteFromHeaders();
  const content = generateContent(site);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-gray-600">&rsaquo;</span>
            <span className="text-white">Advertise</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Advertise With Us
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Reach {site.state} readers through {site.name}</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Why Advertise With {site.name}?
            </h2>
            <p>
              {site.name} is the go-to news source for {site.state} residents. As part of the MediaChief network — America&apos;s largest digital newspaper trust with 50 state publications — we offer advertisers unmatched access to engaged, local audiences across the country.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose my-8">
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-black text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>50</div>
                <div className="text-sm text-gray-600 mt-1">State Publications</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-black text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>Local</div>
                <div className="text-sm text-gray-600 mt-1">Targeted Audiences</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-black text-[#c1121f]" style={{ fontFamily: "'Oswald', sans-serif" }}>24/7</div>
                <div className="text-sm text-gray-600 mt-1">News Coverage</div>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Advertising Options
            </h2>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Display Advertising</h3>
            <p>
              Premium ad placements across our website, including banner ads, sidebar ads, and interstitial units. Available in standard IAB sizes (300x250, 728x90, 160x600, 320x50, and more).
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Sponsored Content / Native Advertising</h3>
            <p>
              Tell your brand story through professionally crafted articles that match the look and feel of our editorial content. All sponsored content is clearly labeled in compliance with FTC guidelines and reviewed by our editorial team.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Newsletter Sponsorship</h3>
            <p>
              Reach our most engaged readers through sponsored placement in our daily and weekly email newsletters.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Network-Wide Campaigns</h3>
            <p>
              Through the MediaChief network, you can run campaigns across multiple states or go nationwide with a single buy. Ideal for national brands seeking local relevance.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Advertising Guidelines
            </h2>
            <p>To maintain the trust of our readers, all advertising on {site.name} must comply with the following guidelines:</p>
            <ul>
              <li>Sponsored content and native advertising must be clearly labeled as &quot;Sponsored,&quot; &quot;Paid Content,&quot; or &quot;Advertisement&quot; in compliance with FTC regulations.</li>
              <li>Advertisements must not contain false, misleading, or deceptive claims.</li>
              <li>We reserve the right to reject any advertisement that we determine is inappropriate, misleading, or inconsistent with our editorial standards.</li>
              <li>Advertisers do not have any influence over editorial content, including news coverage, headlines, or article placement.</li>
              <li>All advertisements must comply with applicable federal, state, and local laws.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Get Started
            </h2>
            <p>
              Ready to reach {site.state} readers? Contact our advertising team:
            </p>
            <p>
              <strong>Email:</strong> ads@{site.domain}<br />
              <strong>Network Sales:</strong> advertising@mediachief.com<br />
              <strong>Subject Line:</strong> &quot;Advertising Inquiry — {site.name}&quot;
            </p>
            <p>
              We&apos;ll respond within 1-2 business days with a media kit, rate card, and custom proposal tailored to your goals.
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
