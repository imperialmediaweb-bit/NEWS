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
    title: "Careers",
    description: `Careers at ${site.name} and MediaChief. Join America's largest digital newspaper network with 50 state publications.`,
    alternates: { canonical: `https://${site.domain}/careers` },
  };
}

export default function CareersPage() {
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
            <span className="text-white">Careers</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Careers at MediaChief
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Join America&apos;s largest digital newspaper network</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              About MediaChief
            </h2>
            <p>
              MediaChief is the largest digital newspaper trust in the United States, operating 50 state-based news publications — including {site.name}. We are dedicated to revitalizing local journalism through modern technology, innovative storytelling, and a commitment to serving every community in America.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Why Work With Us
            </h2>
            <ul>
              <li><strong>National Impact, Local Focus:</strong> Your work reaches readers in communities that need quality local journalism the most.</li>
              <li><strong>Innovation-Driven:</strong> We leverage cutting-edge technology, including AI-assisted tools, to enhance journalism — not replace it.</li>
              <li><strong>Growth Opportunities:</strong> With 50 publications and a growing digital platform, there are ample opportunities for career advancement.</li>
              <li><strong>Remote-Friendly:</strong> Many roles can be performed remotely, allowing you to work from anywhere in the United States.</li>
              <li><strong>Diverse Team:</strong> We value diversity of perspective, background, and experience in our newsrooms.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Departments
            </h2>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Editorial &amp; Journalism</h3>
            <p>
              Reporters, editors, photographers, and multimedia journalists covering local news, politics, sports, crime, business, and community events across all 50 states.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Technology &amp; Product</h3>
            <p>
              Software engineers, product managers, data analysts, and UX designers building and maintaining our digital news platform.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Advertising &amp; Revenue</h3>
            <p>
              Sales representatives, account managers, and digital marketing specialists driving revenue growth across our network.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>Operations &amp; Management</h3>
            <p>
              Finance, HR, legal, and operations professionals supporting the day-to-day operations of our 50-publication network.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              How to Apply
            </h2>
            <p>
              To inquire about current openings or submit your resume for future consideration, please email:
            </p>
            <p>
              <strong>Email:</strong> careers@mediachief.com<br />
              <strong>Subject Line:</strong> &quot;[Position of Interest] — [Your Name]&quot;
            </p>
            <p>
              Please include your resume, a brief cover letter, and any relevant portfolio or writing samples.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              Equal Opportunity Employer
            </h2>
            <p>
              MediaChief is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees. We do not discriminate on the basis of race, color, religion, sex, sexual orientation, gender identity, national origin, disability, veteran status, or any other legally protected characteristic.
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
