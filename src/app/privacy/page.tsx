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
    title: "Privacy Policy",
    description: `Privacy Policy for ${site.name}. Learn how we collect, use, and protect your personal information. CCPA and state privacy law compliant.`,
    alternates: { canonical: `https://${site.domain}/privacy` },
  };
}

export default function PrivacyPage() {
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
            <span className="text-white">Privacy Policy</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            Privacy Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Last updated: January 1, 2026</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              1. Introduction
            </h2>
            <p>
              {site.name} (&quot;{site.domain}&quot;), a publication of MediaChief (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this Privacy Policy carefully. By using {site.name}, you consent to the data practices described in this policy.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              2. Information We Collect
            </h2>
            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.1 Information Automatically Collected</h3>
            <p>When you visit {site.name}, we may automatically collect certain information about your device and usage, including:</p>
            <ul>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, screen resolution, and language preferences.</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, referring URL, and the page you visited before navigating to our website.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with the website, including click patterns, scroll depth, and time spent on pages.</li>
              <li><strong>Location Data:</strong> Approximate geographic location based on your IP address (city/state level only).</li>
            </ul>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>2.2 Information You Provide</h3>
            <p>We may collect information that you voluntarily provide to us, including:</p>
            <ul>
              <li><strong>Newsletter Subscriptions:</strong> Email address when you subscribe to our newsletter.</li>
              <li><strong>Contact Forms:</strong> Name, email address, and message content when you contact us.</li>
              <li><strong>Comments:</strong> Name, email address, and comment content if you engage with our content.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Operate, maintain, and improve {site.name};</li>
              <li>Deliver newsletters and other communications you have requested;</li>
              <li>Analyze usage trends and preferences to improve user experience;</li>
              <li>Display relevant advertising based on your interests;</li>
              <li>Detect, prevent, and address technical issues and security threats;</li>
              <li>Comply with legal obligations and enforce our Terms of Use.</li>
            </ul>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              4. Cookies &amp; Tracking Technologies
            </h2>
            <p>
              {site.name} uses cookies and similar tracking technologies (pixels, web beacons, local storage) to collect and store information about your preferences and activity. These include:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the website to function properly (session management, security).</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website (e.g., Google Analytics).</li>
              <li><strong>Advertising Cookies:</strong> Used to deliver targeted advertisements and measure ad campaign effectiveness.</li>
              <li><strong>Social Media Cookies:</strong> Enable social sharing features and may track your activity across websites.</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect the functionality of certain features on our website.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              5. Third-Party Sharing
            </h2>
            <p>We may share your information with the following categories of third parties:</p>
            <ul>
              <li><strong>Analytics Providers:</strong> Such as Google Analytics, to help us understand website usage.</li>
              <li><strong>Advertising Partners:</strong> To serve relevant advertisements. These partners may use cookies to collect information about your online activities across websites.</li>
              <li><strong>Service Providers:</strong> Third parties that help us operate our website (hosting, email delivery, content delivery networks).</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law, court order, or governmental authority.</li>
            </ul>
            <p>We do not sell your personal information to third parties for monetary consideration. For information about sharing for targeted advertising and your opt-out rights, see Section 8 below.</p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              6. Data Retention
            </h2>
            <p>
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Analytics data is retained in aggregate form. Newsletter subscriber information is retained until you unsubscribe.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              7. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              8. Your Privacy Rights
            </h2>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.1 California Residents (CCPA/CPRA)</h3>
            <p>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):</p>
            <ul>
              <li><strong>Right to Know:</strong> You may request that we disclose the categories and specific pieces of personal information we have collected about you, the categories of sources, the business purpose for collecting it, and the categories of third parties with whom we share it.</li>
              <li><strong>Right to Delete:</strong> You may request that we delete personal information we have collected from you, subject to certain exceptions.</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> You have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information for targeted advertising purposes.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA/CPRA rights.</li>
              <li><strong>Right to Correct:</strong> You may request that we correct inaccurate personal information.</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> You may limit the use of sensitive personal information to purposes necessary for providing our services.</li>
            </ul>
            <p>To exercise these rights, contact us at privacy@{site.domain}.</p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.2 Virginia Residents (VCDPA)</h3>
            <p>Virginia residents have the right to access, correct, delete, and obtain a copy of their personal data, and to opt out of targeted advertising, sale of personal data, and profiling.</p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.3 Colorado Residents (CPA)</h3>
            <p>Colorado residents have rights to access, correct, delete, and port their personal data, and to opt out of targeted advertising, sale, and profiling.</p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.4 Connecticut Residents (CTDPA)</h3>
            <p>Connecticut residents have rights to access, correct, delete, and obtain a copy of personal data, and to opt out of targeted advertising, sale, and profiling.</p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.5 Utah Residents (UCPA)</h3>
            <p>Utah residents have rights to access and delete personal data and to opt out of targeted advertising and sale of personal data.</p>

            <h3 style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontSize: "1rem" }}>8.6 Do Not Sell My Personal Information</h3>
            <p>
              To opt out of the sale or sharing of your personal information for targeted advertising purposes, please email us at privacy@{site.domain} with the subject line &quot;Do Not Sell My Personal Information.&quot; We will process your request within 15 business days.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              9. Children&apos;s Privacy
            </h2>
            <p>
              {site.name} does not knowingly collect personal information from children under 13 years of age. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information as soon as possible. If you believe that we have collected information from a child under 13, please contact us at privacy@{site.domain}.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              10. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes. Your continued use of {site.name} after any modifications constitutes your acknowledgment and consent to the updated policy.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              11. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, wish to exercise your privacy rights, or have a privacy-related complaint, please contact us at:
            </p>
            <p>
              <strong>{site.name}</strong> — A MediaChief Publication<br />
              Privacy Officer<br />
              Email: privacy@{site.domain}<br />
              Website: <Link href="/contact" className="text-[#c1121f] underline">Contact Page</Link>
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
