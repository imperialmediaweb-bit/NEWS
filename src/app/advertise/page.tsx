import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdvertiseForm from "@/components/AdvertiseForm";
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

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              Why Advertise With {site.name}?
            </h2>
            <p>
              {site.name} covers news from across {site.state}: local government, public safety, schools, business, sports and weather. Advertising with us puts your business in front of readers looking for what is happening where they live.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose my-8">
              <a href="/promote" className="block bg-gray-50 rounded-lg p-5 text-center hover:bg-gray-100">
                <div className="text-3xl font-black text-[var(--accent)]" style={{ fontFamily: "'Oswald', sans-serif" }}>$99</div>
                <div className="text-sm text-gray-600 mt-1">Sponsored story — order online ›</div>
              </a>
              <div className="bg-gray-50 rounded-lg p-5 text-center">
                <div className="text-3xl font-black text-[var(--accent)]" style={{ fontFamily: "'Oswald', sans-serif" }}>Local</div>
                <div className="text-sm text-gray-600 mt-1">Targeted Audiences</div>
              </div>
              <a href="/obituaries/submit" className="block bg-gray-50 rounded-lg p-5 text-center hover:bg-gray-100">
                <div className="text-3xl font-black text-[var(--accent)]" style={{ fontFamily: "'Oswald', sans-serif" }}>$25</div>
                <div className="text-sm text-gray-600 mt-1">Obituary with photo — place online ›</div>
              </a>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
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

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
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

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              Buy now by card
            </h2>
            <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
              <a href="/promote" className="block rounded-lg border-2 p-5 hover:bg-gray-50" style={{ borderColor: "var(--accent)" }}>
                <div className="text-[13px] font-bold uppercase tracking-wide text-gray-500">Sponsored story</div>
                <div className="mt-1 text-3xl font-black" style={{ color: "var(--accent)" }}>$99</div>
                <p className="mt-2 text-[14px] text-gray-700">Your announcement on {site.name}, labelled Sponsored, with a link to your website. Write it, pay by card, live within one business day.</p>
                <span className="mt-3 inline-block rounded px-4 py-2 text-[14px] font-bold text-white" style={{ background: "var(--accent)" }}>Order and pay ›</span>
              </a>
              <a href="/obituaries/submit" className="block rounded-lg border-2 border-gray-300 p-5 hover:bg-gray-50">
                <div className="text-[13px] font-bold uppercase tracking-wide text-gray-500">Obituary</div>
                <div className="mt-1 text-3xl font-black text-gray-800">$25</div>
                <p className="mt-2 text-[14px] text-gray-700">An obituary with photo that stays on the site and can be shared with family and friends.</p>
                <span className="mt-3 inline-block rounded bg-gray-800 px-4 py-2 text-[14px] font-bold text-white">Place an obituary ›</span>
              </a>
            </div>
            <p className="not-prose text-[13px] text-gray-500">Secure card payment by Stripe. Full refund if we decline it.</p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              Bigger campaigns
            </h2>
            <p>
              Ready to reach {site.state} readers? Tell us what you want to promote and
              we&apos;ll come back with options and pricing. You can also reach us through
              the <Link href="/contact" className="text-[var(--accent)] underline">contact page</Link>.
            </p>

          </div>

          {/* The page described four products and offered no way to order any
              of them, so every enquiry depended on a reader hunting down an
              address and writing one unprompted. */}
          <div className="mt-8">
            <AdvertiseForm site={site} />
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
