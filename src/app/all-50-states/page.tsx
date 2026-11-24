import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { sites } from "@/config/sites";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

/**
 * The 50-state package on every paper: one article or press release on every
 * state paper of the network for $149, ordered through MediaChief.
 */
export const dynamic = "force-dynamic";
const ORDER = "https://media-chief.com/order?package=national";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `Publish Your Article or Press Release on 50 U.S. State News Sites ($149)`,
    description: `One article or press release on all 50 state news sites of the ${site.name} network, one in every U.S. state, live within 24 hours, with a full report of the links. $149, one-time.`,
    alternates: { canonical: `https://${site.domain}/all-50-states` },
  };
}

export default function All50() {
  const site = siteFromHeaders();
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const papers = Object.values(sites).sort((a, b) => a.state.localeCompare(b.state));
  const faqs: Array<[string, string]> = [
    ["What do I get for $149?", `Your article or press release published on all ${papers.length} state news sites of the network, one in every U.S. state, including ${site.name}. It goes live within 24 hours, stays online permanently, and you receive a report with every link.`],
    ["Is the content labelled?", "Yes. As U.S. FTC rules require, it is labelled as a press release or sponsored content, and links in it are marked as sponsored."],
    ["Who is it for?", "Companies, startups, PR agencies, nonprofits and authors with national news: product launches, funding, expansions, awards, books, events."],
    ["Can I publish in one state only?", `Yes: a press release on ${site.name} alone costs $49.`],
    ["What is not accepted?", "Cannabis, vaping, drugs or supplements, crypto or investment offers, payday loans, adult content, weapons and anything misleading."],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "Service", name: "Press release and article publishing on 50 U.S. state news sites", serviceType: "Press release distribution", areaServed: { "@type": "Country", name: "United States" }, provider: { "@type": "NewsMediaOrganization", name: site.name, url: `https://${site.domain}` }, offers: { "@type": "Offer", price: "149.00", priceCurrency: "USD", url: ORDER } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[1100px] px-4 py-12">
          <p className="text-[13px] font-black uppercase tracking-[.22em] opacity-80">National package</p>
          <h1 className="mt-2 text-[34px] font-black leading-[1.05] md:text-[56px]">Your news on all 50 U.S. state news sites</h1>
          <p className="mt-4 max-w-[760px] text-[18px] opacity-90">One article or press release, published on every state paper of the network, one in each state from {papers[0]?.name} to {papers[papers.length - 1]?.name}. Live within 24 hours, permanent, with a full report of every link.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={ORDER} className="px-7 py-4 text-[17px] font-black uppercase tracking-wider" style={{ background: acc }}>Publish on all 50 · $149</a>
            <span className="text-[15px] opacity-80">One-time payment · under $3 per state · full refund if declined</span>
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["50 states, one order", "The same release on every state news site of the network, so readers in every state can find it."],
            ["Live in 24 hours", "Published within a day, with a report listing all 50 article links for your client or your records."],
            ["Permanent and labelled", "Stays online for good, labelled as a press release, with your photo or logo and a link to your website."],
          ].map(([t, d]) => (
            <div key={t} className="border-t-[5px] bg-white p-5 shadow-sm" style={{ borderColor: acc }}><b className="block text-[18px]">{t}</b><p className="mt-2 text-[15.5px] text-gray-700">{d}</p></div>
          ))}
        </div>
        <h2 className="mt-12 text-[26px] font-black">The 50 papers in the network</h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-3 lg:grid-cols-5">
          {papers.map((p) => <li key={p.slug}><a href={`https://${p.domain}`} className="hover:underline">{p.name}</a></li>)}
        </ul>
        <section className="mt-12">
          <h2 className="text-[24px] font-black">Questions</h2>
          <div className="mt-3 divide-y border-y bg-white">
            {faqs.map(([q, a]) => <details key={q} className="p-4"><summary className="cursor-pointer text-[16.5px] font-bold">{q}</summary><p className="mt-2 text-[15.5px] text-gray-700">{a}</p></details>)}
          </div>
        </section>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 p-6 text-white sm:flex-row sm:items-center" style={{ background: ink }}>
          <p className="text-[18px]"><b>Only need {site.state}?</b> Publish on {site.name} alone for $49.</p>
          <div className="flex gap-3">
            <a href="/press-release" className="border border-white/60 px-5 py-3 font-black">{site.state} only · $49</a>
            <a href={ORDER} className="px-5 py-3 font-black" style={{ background: acc }}>All 50 · $149</a>
          </div>
        </div>
        <p className="mt-6 text-[13px] text-gray-500">National orders are processed by MediaChief, the publisher of the network.</p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
