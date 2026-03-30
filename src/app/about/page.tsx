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
    title: "About Us",
    description: `About ${site.name} — ${site.state}'s premier news source. A MediaChief publication delivering breaking news from ${site.city}, ${site.state}.`,
    alternates: { canonical: `https://${site.domain}/about` },
  };
}

export default function AboutPage() {
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
            <span className="text-white">About Us</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            About {site.name}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">{site.tagline}</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Who We Are
            </h2>
            <p>
              {site.name} is {site.state}&apos;s premier digital news publication, delivering breaking news, in-depth reporting, and essential local coverage to readers across {site.state}. Based in {site.city}, we cover the stories that matter most to {site.state} residents — from local politics and crime to sports, entertainment, business, and community events.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Part of the MediaChief Network
            </h2>
            <p>
              {site.name} is a proud member of the MediaChief network — America&apos;s largest digital newspaper trust with 50 state-based publications covering every corner of the United States. From coast to coast, MediaChief delivers local news with a national reach, connecting communities through trusted journalism.
            </p>
            <p>
              Each MediaChief publication is tailored to its state and community, with content focused on local issues, local government, local businesses, and the people who make each state unique. While we share resources and infrastructure, our editorial voice is distinctly {site.state}.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Our Mission
            </h2>
            <p>
              Our mission is simple: <strong>to inform, engage, and empower the residents of {site.state}</strong> through accurate, timely, and fearless journalism. We believe every community deserves access to quality local news, and we are committed to providing it — free and accessible to all.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              What We Cover
            </h2>
            <ul>
              <li><strong>Local News:</strong> {site.city} and {site.state} news that impacts your daily life</li>
              <li><strong>Politics:</strong> State legislature, local government, elections, and policy</li>
              <li><strong>Crime &amp; Public Safety:</strong> Police reports, court proceedings, and community safety</li>
              <li><strong>Sports:</strong> Local teams, high school sports, college athletics, and professional sports</li>
              <li><strong>Business &amp; Economy:</strong> {site.state} business news, real estate, jobs, and economic trends</li>
              <li><strong>Entertainment &amp; Lifestyle:</strong> Events, dining, culture, and community life</li>
              <li><strong>Weather:</strong> Forecasts, severe weather alerts, and climate news for {site.state}</li>
              <li><strong>US &amp; World News:</strong> National and international stories that affect {site.state}</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Our Editorial Standards
            </h2>
            <p>
              We hold ourselves to the highest standards of journalistic ethics and integrity. Our coverage is guided by principles of accuracy, fairness, independence, and accountability. For details, see our <Link href="/ethics" className="text-[#c1121f] underline">Ethics Policy</Link> and <Link href="/editorial-policy" className="text-[#c1121f] underline">Editorial Policy</Link>.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Contact Us
            </h2>
            <p>
              We want to hear from you. Whether you have a news tip, a question, feedback, or a correction, please reach out:
            </p>
            <ul>
              <li><strong>General Inquiries:</strong> info@{site.domain}</li>
              <li><strong>News Tips:</strong> tips@{site.domain}</li>
              <li><strong>Advertising:</strong> ads@{site.domain}</li>
            </ul>
            <p>
              Visit our <Link href="/contact" className="text-[#c1121f] underline">Contact Page</Link> for more ways to reach us, or explore <Link href="/careers" className="text-[#c1121f] underline">career opportunities</Link> at MediaChief.
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
