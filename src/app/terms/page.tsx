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
    title: "Terms of Use",
    description: `Terms of Use for ${site.name}. Read our terms and conditions governing your use of ${site.domain}.`,
    alternates: { canonical: `https://${site.domain}/terms` },
  };
}

export default function TermsPage() {
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
            <span className="text-white">Terms of Use</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Terms of Use
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Last updated: January 1, 2026</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using {site.name} (&quot;{site.domain}&quot;), a publication of MediaChief, you agree to be bound by these Terms of Use (&quot;Terms&quot;). If you do not agree to these Terms, you must not access or use this website. These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
            <p>
              {site.name} reserves the right to update or modify these Terms at any time without prior notice. Your continued use of the website following any changes constitutes your acceptance of such changes. We encourage you to review these Terms periodically.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              2. Intellectual Property &amp; Content Ownership
            </h2>
            <p>
              All content published on {site.name}, including but not limited to articles, photographs, graphics, videos, logos, page layouts, and software, is the property of MediaChief or its content suppliers and is protected by United States and international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any content from this website without the prior written consent of {site.name}, except as follows:
            </p>
            <ul>
              <li>You may temporarily store copies of materials in RAM incidental to your accessing and viewing those materials.</li>
              <li>You may store files that are automatically cached by your web browser for display enhancement purposes.</li>
              <li>You may print or download one copy of a reasonable number of pages for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
              <li>You may share links to our articles via social media, provided you do not modify the content.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              3. Prohibited Uses
            </h2>
            <p>You agree not to use {site.name} for any purpose that is unlawful or prohibited by these Terms. Specifically, you agree not to:</p>
            <ul>
              <li>Use any robot, spider, scraper, or other automated means to access the website for any purpose without our express written permission.</li>
              <li>Copy, republish, or redistribute our content for commercial purposes.</li>
              <li>Frame or mirror any part of this website without prior written authorization.</li>
              <li>Use the website to transmit any advertising or promotional material, including &quot;spam&quot; or unsolicited communications.</li>
              <li>Impersonate or attempt to impersonate {site.name}, a {site.name} employee, another user, or any other person or entity.</li>
              <li>Engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the website.</li>
              <li>Attempt to gain unauthorized access to any portion of the website, other accounts, computer systems, or networks connected to the website.</li>
              <li>Use the website in any manner that could disable, overburden, damage, or impair the site.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              4. User-Generated Content
            </h2>
            <p>
              If you submit comments, letters, feedback, or other content to {site.name} (&quot;User Content&quot;), you grant MediaChief a non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such User Content throughout the world in any media.
            </p>
            <p>
              You represent and warrant that: (a) you own or control all rights in and to the User Content; (b) the User Content is accurate; (c) the User Content does not violate these Terms; and (d) the User Content will not cause injury to any person or entity.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              5. Disclaimer of Warranties
            </h2>
            <p>
              THE WEBSITE AND ALL CONTENT, MATERIALS, INFORMATION, AND SERVICES PROVIDED ON THE WEBSITE ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER MEDIACHIEF NOR {site.name.toUpperCase()} MAKES ANY WARRANTY THAT THE WEBSITE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
            <p>
              {site.name} does not warrant the accuracy, completeness, or usefulness of any information on the website. Any reliance you place on such information is strictly at your own risk. We disclaim all liability and responsibility arising from any reliance placed on such materials by you or any other visitor to the website.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              6. Limitation of Liability
            </h2>
            <p>
              IN NO EVENT SHALL MEDIACHIEF, {site.name.toUpperCase()}, THEIR DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, CONTRACTORS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul>
              <li>Your access to or use of, or inability to access or use, the website;</li>
              <li>Any conduct or content of any third party on the website;</li>
              <li>Any content obtained from the website; and</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            </ul>
            <p>
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT OF ONE HUNDRED DOLLARS ($100.00).
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              7. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless MediaChief, {site.name}, and their officers, directors, employees, agents, licensors, and suppliers from and against all claims, losses, expenses, damages, and costs, including reasonable attorneys&apos; fees, resulting from any violation of these Terms or any activity related to your account (including negligent or wrongful conduct).
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              8. Third-Party Links
            </h2>
            <p>
              {site.name} may contain links to third-party websites or services that are not owned or controlled by MediaChief. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that {site.name} shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              9. Copyright Complaints (DMCA)
            </h2>
            <p>
              If you believe that any content on {site.name} infringes your copyright, please see our <Link href="/dmca" className="text-[#c1121f] underline">DMCA Policy</Link> for instructions on sending us a notice of copyright infringement. It is our policy to respond to clear notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              10. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of {site.state}, without regard to its conflict of law provisions. Any dispute arising from or relating to these Terms or your use of the website shall be resolved exclusively in the state or federal courts located in {site.state}.
            </p>
            <p>
              Any cause of action or claim you may have arising out of or relating to these Terms or the website must be commenced within one (1) year after the cause of action accrues. Otherwise, such cause of action or claim is permanently barred.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              11. Age Requirement
            </h2>
            <p>
              You must be at least 13 years of age to use this website. By using {site.name}, you represent and warrant that you are at least 13 years old. If you are under 18, you may use the website only with the involvement and consent of a parent or guardian.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              12. Severability
            </h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              13. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>{site.name}</strong> — A MediaChief Publication<br />
              Visit our <Link href="/contact" className="text-[#c1121f] underline">Contact Page</Link>
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
