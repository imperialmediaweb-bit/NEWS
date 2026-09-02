import { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import { generateContent } from "@/data/generate-content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";

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
    title: "Contact Us",
    description: `Contact ${site.name}. Reach our editorial team, submit news tips, report errors, or inquire about advertising in ${site.city}, ${site.state}.`,
    alternates: { canonical: `https://${site.domain}/contact` },
  };
}

export default function ContactPage() {
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
            <span className="text-white">Contact</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Contact Us
          </h1>
          <p className="text-gray-400 mt-2 text-sm">We want to hear from you</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="space-y-6">
            <ContactForm siteName={site.name} siteDomain={site.domain} />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                Get in Touch
              </h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Use the contact form to reach our team. Select the appropriate department and we&apos;ll make sure your message gets to the right people.
              </p>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>Location</h3>
                    <p className="text-gray-600 text-sm">{site.city}, {site.state}</p>
                    <p className="text-gray-400 text-xs mt-1">A MediaChief Publication</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}>Response Time</h3>
                    <p className="text-gray-600 text-sm">We typically respond within 1-2 business days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 text-white">
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
                Have a News Tip?
              </h2>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Know about a story we should cover? We welcome news tips from the {site.state} community. Select &quot;News Tips&quot; in the contact form to submit your tip confidentially.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
