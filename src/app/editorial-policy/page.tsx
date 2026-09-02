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
    title: "Editorial Policy",
    description: `Editorial Policy for ${site.name}. How we create content, our AI disclosure standards, fact-checking process, and FTC compliance.`,
    alternates: { canonical: `https://${site.domain}/editorial-policy` },
  };
}

export default function EditorialPolicyPage() {
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
            <span className="text-white">Editorial Policy</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Editorial Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">How we create and verify our content</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              1. Content Creation Standards
            </h2>
            <p>
              {site.name} is committed to delivering accurate, timely, and relevant news to the residents of {site.city}, {site.state}, and beyond. All content published on our platform undergoes editorial review to ensure it meets our standards for accuracy, fairness, and quality.
            </p>
            <ul>
              <li>All news articles are based on verifiable facts from official sources, public records, firsthand reporting, or credible news agencies.</li>
              <li>Opinion and editorial content is clearly labeled and separated from news reporting.</li>
              <li>All claims are attributed to specific, named sources whenever possible.</li>
              <li>Direct quotes are used accurately and in proper context.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              2. AI Content Disclosure
            </h2>
            <div style={{ background: "#fff3f3", padding: "1.5rem", borderLeft: "4px solid var(--accent)", margin: "1rem 0", borderRadius: "0 8px 8px 0" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Some content on {site.name} may be created with the assistance of artificial intelligence (AI) technology. We believe in full transparency about our content creation process.
              </p>
            </div>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.1 How We Use AI</h3>
            <ul>
              <li><strong>AI-Assisted Content:</strong> Some articles may be drafted, summarized, or edited with the assistance of AI tools. These articles are always reviewed, fact-checked, and approved by a human editor before publication.</li>
              <li><strong>AI-Generated Content:</strong> In limited cases, AI may generate content such as weather summaries, financial data roundups, or event listings. This content is labeled accordingly.</li>
              <li><strong>Human Oversight:</strong> No AI-generated content is published without human editorial review. A human editor is responsible for verifying all facts, names, dates, and claims before publication.</li>
            </ul>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.2 AI Content Rules</h3>
            <ul>
              <li>AI cannot be the sole source for any factual claim. All facts must be independently verifiable.</li>
              <li>AI-generated content must not include fabricated quotes attributed to real people.</li>
              <li>AI is not used to create deepfake images, audio, or video content.</li>
              <li>Human editors verify all names, dates, locations, and specific claims in AI-assisted content.</li>
              <li>When an article has been substantially created by AI, this is disclosed in the byline (e.g., &quot;Staff Report&quot; or &quot;AI-Assisted&quot;).</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              3. Fact-Checking Process
            </h2>
            <ul>
              <li>Primary sources (official records, direct witnesses, government documents) are prioritized over secondary sources.</li>
              <li>Claims from a single source are independently verified before publication when possible.</li>
              <li>When verification is not possible, the article clearly states that the information comes from a single source and has not been independently confirmed.</li>
              <li>Breaking news is updated as new information becomes available, with timestamps noting updates.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              4. Attribution &amp; Sourcing
            </h2>
            <ul>
              <li>All factual claims are attributed to their source using phrases such as &quot;according to,&quot; &quot;police said,&quot; &quot;court records show,&quot; or &quot;sources report.&quot;</li>
              <li>Named sources are preferred over anonymous sources.</li>
              <li>When anonymous sources are used, the article explains why the source requested anonymity and provides as much identifying information as possible without revealing the source&apos;s identity.</li>
              <li>Government records, court documents, and official statements are cited with specific references.</li>
              <li>Social media posts used as sources are attributed to the poster and include a note that the content may be deleted or modified.</li>
              <li>When citing other news organizations, we provide attribution and link to the original report.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              5. Sponsored Content &amp; FTC Compliance
            </h2>
            <p>
              {site.name} complies with the Federal Trade Commission (FTC) guidelines regarding sponsored content, native advertising, and endorsements:
            </p>
            <ul>
              <li>Sponsored content is clearly labeled with designations such as &quot;Sponsored,&quot; &quot;Paid Content,&quot; &quot;Advertisement,&quot; or &quot;Promoted.&quot;</li>
              <li>Native advertising is visually and textually distinguished from editorial content.</li>
              <li>Affiliate links are disclosed. Articles containing affiliate links include a disclosure statement.</li>
              <li>Product reviews and endorsements include material connection disclosures as required by FTC 16 CFR Part 255.</li>
              <li>Advertisers do not have editorial control over sponsored content. All sponsored content is reviewed by editorial staff.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              6. Byline Standards
            </h2>
            <ul>
              <li><strong>Named Bylines:</strong> Articles written primarily by a specific journalist carry that journalist&apos;s byline.</li>
              <li><strong>&quot;Staff Report&quot;:</strong> Used for articles compiled from multiple sources, press releases, or wire services where no single journalist is the primary author.</li>
              <li><strong>&quot;{site.name} Editorial Board&quot;:</strong> Used for editorials and opinion pieces representing the publication&apos;s stance.</li>
              <li><strong>Contributing Writers:</strong> Guest contributors and freelancers are identified as such.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              7. Image &amp; Media Usage
            </h2>
            <ul>
              <li>All images used in articles are either owned by {site.name}/MediaChief, licensed, obtained under fair use, or sourced from the public domain.</li>
              <li>Stock images are labeled as such and not presented as photojournalism.</li>
              <li>Images are not digitally altered in ways that would mislead readers about the content they depict.</li>
              <li>Photo credits are provided when required by the license or source.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              8. Pre-Publication Compliance Checklist
            </h2>
            <p>Every article published on {site.name} must satisfy the following before publication:</p>
            <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px", margin: "1rem 0" }}>
              <ul style={{ margin: 0 }}>
                <li>All factual claims attributed to a named or identified source</li>
                <li>&quot;Alleged&quot; or &quot;accused&quot; used for unproven criminal accusations</li>
                <li>No unverified or fabricated quotes</li>
                <li>All images owned, licensed, or public domain</li>
                <li>Sponsored content clearly labeled</li>
                <li>AI involvement disclosed if applicable</li>
                <li>Subject given opportunity to respond (for negative coverage)</li>
                <li>No private personal information without consent</li>
                <li>Headline accurately reflects article content</li>
                <li>Sources cited and linked where possible</li>
              </ul>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              9. Corrections &amp; Updates
            </h2>
            <p>
              When errors are identified after publication, we follow our <Link href="/corrections" className="text-[var(--accent)] underline">Corrections Policy</Link>. Significant corrections are noted at the top of the article with the date of correction. We do not silently alter published content.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              10. Contact
            </h2>
            <p>
              Questions about our editorial practices? Contact our editorial team at:
            </p>
            <p>
              Visit our <Link href="/contact" className="text-[var(--accent)] underline">Contact Page</Link><br />
              See also: <Link href="/ethics" className="text-[var(--accent)] underline">Ethics Policy</Link> | <Link href="/corrections" className="text-[var(--accent)] underline">Corrections Policy</Link>
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
