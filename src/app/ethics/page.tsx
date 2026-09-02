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
    title: "Ethics Policy",
    description: `Ethics Policy for ${site.name}. Our commitment to journalistic integrity, accuracy, fairness, and editorial independence.`,
    alternates: { canonical: `https://${site.domain}/ethics` },
  };
}

export default function EthicsPage() {
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
            <span className="text-white">Ethics Policy</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Ethics Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Our commitment to journalistic integrity</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              1. Our Mission
            </h2>
            <p>
              {site.name}, a MediaChief publication, is dedicated to providing accurate, fair, and comprehensive news coverage to the residents of {site.state}. We believe that ethical journalism is the foundation of a well-informed society and a functioning democracy. This Ethics Policy outlines the principles that guide our newsroom.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              2. Accuracy &amp; Fact-Checking
            </h2>
            <ul>
              <li>We strive to publish only information we have verified to be accurate. When errors occur, we correct them promptly and transparently.</li>
              <li>All factual claims must be attributed to a named, verifiable source. Unverified information is not published as fact.</li>
              <li>Headlines must accurately reflect the content of the article. Misleading or sensationalized headlines are prohibited.</li>
              <li>Statistics, data, and research findings must be presented in proper context with attribution to the original source.</li>
              <li>When information is uncertain or developing, we clearly communicate this to readers using language such as &quot;according to preliminary reports&quot; or &quot;details are still emerging.&quot;</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              3. Fairness &amp; Impartiality
            </h2>
            <ul>
              <li>We present all sides of a story when reasonably possible. Subjects of negative coverage are given an opportunity to respond before publication.</li>
              <li>We distinguish clearly between news reporting and opinion/editorial content. News articles must be free from reporter opinion.</li>
              <li>We do not use language that demeans or stereotypes individuals or groups based on race, ethnicity, gender, sexual orientation, religion, disability, or socioeconomic status.</li>
              <li>We use &quot;alleged&quot; or &quot;accused&quot; for unproven criminal accusations. We do not refer to suspects as &quot;guilty&quot; or &quot;criminals&quot; prior to conviction.</li>
              <li>When reporting on legal matters, we distinguish between charges, indictments, arrests, and convictions.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              4. Independence &amp; Conflicts of Interest
            </h2>
            <ul>
              <li>Our editorial decisions are made independently of advertisers, sponsors, political entities, and business interests.</li>
              <li>Staff members must disclose any personal, financial, or political interests that could create a conflict of interest with their reporting responsibilities.</li>
              <li>Staff members may not cover stories in which they have a personal or financial interest without disclosure to and approval from editorial leadership.</li>
              <li>We do not accept gifts, favors, or special treatment from sources, subjects, or interested parties that could compromise our independence.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              5. Advertising &amp; Editorial Separation
            </h2>
            <ul>
              <li>Advertising content is clearly separated from editorial content. Sponsored articles, native advertising, and advertorials are prominently labeled as such in compliance with Federal Trade Commission (FTC) guidelines.</li>
              <li>Advertisers have no influence over editorial content, headlines, or placement of news stories.</li>
              <li>Paid promotional content is reviewed by editorial staff to ensure it does not mislead readers.</li>
              <li>We comply with FTC 16 CFR Part 255 (Guides Concerning the Use of Endorsements and Testimonials in Advertising).</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              6. Source Protection
            </h2>
            <ul>
              <li>We protect the identity of confidential sources. Anonymous sources are used only when the information is of significant public interest and cannot be obtained by other means.</li>
              <li>Information from anonymous sources must be independently verified before publication.</li>
              <li>{site.state} has reporter&apos;s privilege protections that we rely upon when necessary to protect sources.</li>
              <li>We do not reveal the identity of victims of sexual assault unless the victim consents.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              7. Defamation Prevention
            </h2>
            <ul>
              <li>All published statements of fact about individuals or organizations must be verifiable and supported by evidence.</li>
              <li>Opinion is clearly labeled and based on disclosed facts. Even in opinion pieces, writers must avoid making false statements of fact.</li>
              <li>Reports of criminal activity include proper attribution (&quot;police said,&quot; &quot;according to court records&quot;) and use appropriate qualifying language (&quot;alleged,&quot; &quot;accused,&quot; &quot;suspected&quot;).</li>
              <li>Before publishing any story that could be considered defamatory, the subject must be contacted for comment. If unable to reach the subject, the article must state that attempts were made.</li>
              <li>We rely on privileged sources (official government records, court documents, legislative proceedings) whenever possible, as these carry legal protection.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              8. Privacy
            </h2>
            <ul>
              <li>We respect the privacy of individuals, especially private citizens who are not public figures.</li>
              <li>We do not publish home addresses, phone numbers, or financial information unless there is a compelling public interest.</li>
              <li>We exercise particular caution when reporting on minors, victims of crime, and individuals in vulnerable situations.</li>
              <li>We do not identify juvenile suspects unless they are charged as adults, in accordance with applicable state law.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              9. Corrections &amp; Accountability
            </h2>
            <p>
              When we make an error, we correct it promptly and transparently. See our <Link href="/corrections" className="text-[var(--accent)] underline">Corrections Policy</Link> for details on how we handle corrections, clarifications, and retractions. We take responsibility for our mistakes and view corrections as an essential part of maintaining public trust.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid var(--accent)", paddingBottom: "0.5rem" }}>
              10. Complaints &amp; Concerns
            </h2>
            <p>
              If you believe {site.name} has violated any principle in this Ethics Policy, we encourage you to contact us:
            </p>
            <p>
              Please visit our <Link href="/contact" className="text-[var(--accent)] underline">Contact Page</Link> to reach us.
              We review all complaints and take appropriate action.
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
