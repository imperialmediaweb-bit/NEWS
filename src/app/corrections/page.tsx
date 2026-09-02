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
    title: "Corrections Policy",
    description: `Corrections Policy for ${site.name}. How we handle errors, corrections, clarifications, and retractions.`,
    alternates: { canonical: `https://${site.domain}/corrections` },
  };
}

export default function CorrectionsPage() {
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
            <span className="text-white">Corrections</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Corrections Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Our commitment to accuracy and accountability</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              1. Our Commitment
            </h2>
            <p>
              {site.name} is committed to accuracy in all of our reporting. When we make an error — whether in fact, context, or presentation — we correct it promptly, transparently, and in a manner proportionate to the original error. We believe that corrections strengthen our credibility and the trust our readers place in us.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              2. Types of Corrections
            </h2>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.1 Correction</h3>
            <p>
              A correction is issued when a factual error is identified in a published article — such as a wrong name, date, statistic, title, or location. The article is updated with the correct information and a correction notice is added at the top or bottom of the article.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.2 Clarification</h3>
            <p>
              A clarification is issued when information in an article, while not factually incorrect, may be misleading or incomplete. A clarification note is added to provide additional context.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.3 Update</h3>
            <p>
              An update is added to an article when significant new information becomes available after the original publication. Updates are timestamped and placed at the top of the article.
            </p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.4 Retraction</h3>
            <p>
              In rare cases where an article is found to be fundamentally flawed — based on false information, fabricated sources, or serious journalistic misconduct — the article may be retracted. Retracted articles are replaced with a retraction notice explaining why the article was removed.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              3. How Corrections Are Displayed
            </h2>
            <ul>
              <li>Corrections are displayed prominently within the article, typically at the top or bottom.</li>
              <li>The correction note includes the date of the correction and a description of what was changed.</li>
              <li>The original erroneous text is not silently removed — the correction explains what was wrong and what has been corrected.</li>
              <li>For significant corrections, the headline may be updated if the original headline was misleading.</li>
            </ul>
            <p><strong>Example format:</strong></p>
            <div style={{ background: "#f9f9f9", padding: "1rem 1.5rem", borderLeft: "4px solid var(--accent)", margin: "1rem 0" }}>
              <p style={{ margin: 0, fontStyle: "italic" }}>
                <strong>Correction (March 15, 2026):</strong> An earlier version of this article incorrectly stated that [incorrect information]. The article has been updated to reflect that [correct information]. We regret the error.
              </p>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              4. How to Report an Error
            </h2>
            <p>
              If you believe you have found an error in any {site.name} content, we encourage you to contact us immediately. Please include:
            </p>
            <ul>
              <li>The URL or headline of the article containing the error;</li>
              <li>A description of the error;</li>
              <li>If possible, a source for the correct information.</li>
            </ul>
            <p>
              Visit our <Link href="/contact" className="text-[var(--accent)] underline">Contact Page</Link> with subject <strong>&quot;Correction Request — [Article Title]&quot;</strong>
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              5. Response Timeline
            </h2>
            <ul>
              <li><strong>Acknowledgment:</strong> We acknowledge receipt of correction requests within 24 hours on business days.</li>
              <li><strong>Review:</strong> Our editorial team reviews the reported error and verifies the correct information.</li>
              <li><strong>Action:</strong> If the error is confirmed, the correction is made within 48 hours. Urgent corrections (those affecting legal matters, safety, or public figures) are prioritized and may be corrected within hours.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              6. Contact
            </h2>
            <p>
              For correction requests or questions about our corrections process:
            </p>
            <p>
              Visit our <Link href="/contact" className="text-[var(--accent)] underline">Contact Page</Link><br />
              See also: <Link href="/ethics" className="text-[var(--accent)] underline">Ethics Policy</Link> | <Link href="/editorial-policy" className="text-[var(--accent)] underline">Editorial Policy</Link>
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
