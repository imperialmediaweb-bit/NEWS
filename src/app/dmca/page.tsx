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
    title: "DMCA Policy",
    description: `DMCA Copyright Policy for ${site.name}. Learn how to file a copyright infringement notice or counter-notification.`,
    alternates: { canonical: `https://${site.domain}/dmca` },
  };
}

export default function DmcaPage() {
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
            <span className="text-white">DMCA Policy</span>
          </nav>
          <h1 className="text-3xl md:text-5xl" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
            DMCA Copyright Policy
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Digital Millennium Copyright Act Compliance</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
          <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif 4', serif", lineHeight: 1.8 }}>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              1. DMCA Compliance
            </h2>
            <p>
              {site.name}, a publication of MediaChief, respects the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 (&quot;DMCA&quot;), 17 U.S.C. &sect; 512, we will respond expeditiously to claims of copyright infringement committed using our website.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              2. Designated Copyright Agent
            </h2>
            <p>
              Our designated agent for receiving notifications of claimed infringement (&quot;Designated Agent&quot;) can be reached at:
            </p>
            <div style={{ background: "#f9f9f9", padding: "1rem 1.5rem", borderLeft: "4px solid #c1121f", margin: "1rem 0" }}>
              <p style={{ margin: 0 }}>
                <strong>DMCA Agent — MediaChief</strong><br />
                {site.name}<br />
                Visit our <Link href="/contact" className="text-[#c1121f] underline">Contact Page</Link> with subject &quot;DMCA Notice — {site.name}&quot;
              </p>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              3. Filing a DMCA Takedown Notice
            </h2>
            <p>
              If you believe that content on {site.name} infringes your copyright, you may submit a written notification to our Designated Agent. Under 17 U.S.C. &sect; 512(c)(3), your notice must include the following:
            </p>
            <ol>
              <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf;</li>
              <li>Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works are covered by a single notification, a representative list of such works;</li>
              <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity, and information reasonably sufficient to permit us to locate the material (such as the URL of the specific page);</li>
              <li>Your contact information, including your address, telephone number, and an email address;</li>
              <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law;</li>
              <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            </ol>
            <p>
              <strong>Important:</strong> Knowingly submitting a materially false DMCA notice may subject you to liability for damages, including costs and attorneys&apos; fees incurred by us or the alleged infringer (17 U.S.C. &sect; 512(f)).
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              4. Counter-Notification
            </h2>
            <p>
              If you believe that material you posted on {site.name} was removed or access to it was disabled by mistake or misidentification, you may file a counter-notification with our Designated Agent. Your counter-notification must include:
            </p>
            <ol>
              <li>Your physical or electronic signature;</li>
              <li>Identification of the material that has been removed or to which access has been disabled, and the location at which the material appeared before it was removed or access to it was disabled;</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification;</li>
              <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or, if outside the United States, the judicial district in which {site.name} is located), and that you will accept service of process from the person who provided the original DMCA notification or an agent of such person.</li>
            </ol>
            <p>
              If we receive a valid counter-notification, we will forward it to the original complaining party. If the original complaining party does not file a court action seeking to restrain the alleged infringer within 10 business days, we may restore the removed material.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              5. Repeat Infringer Policy
            </h2>
            <p>
              In accordance with the DMCA, we have adopted a policy of terminating, in appropriate circumstances, users or accounts that are deemed to be repeat infringers. We may also, at our sole discretion, limit access to the website and/or terminate any users who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              6. Good Faith
            </h2>
            <p>
              {site.name} reserves the right to remove any content alleged to be infringing without prior notice, at our sole discretion, and without liability to you. In appropriate circumstances, we will also terminate a repeat infringer&apos;s account. We process all DMCA notices in good faith and respond to valid claims promptly, typically within 48 to 72 hours.
            </p>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, borderBottom: "2px solid #c1121f", paddingBottom: "0.5rem" }}>
              7. Contact
            </h2>
            <p>
              For any DMCA-related inquiries, please contact:
            </p>
            <p>
              Visit our <Link href="/contact" className="text-[#c1121f] underline">Contact Page</Link> and include &quot;DMCA Notice&quot; or &quot;DMCA Counter-Notification&quot; in your message.
            </p>

          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
