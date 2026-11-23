import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { PRODUCTS } from "@/lib/paid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaidForm from "@/components/PaidForm";
import { generateContent } from "@/data/generate-content";

/** Paid press release publishing: the release as submitted, labelled "Press release", reviewed before it goes live. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} Press Release Distribution: Publish on ${site.name} ($${(PRODUCTS.press_release.cents / 100).toFixed(0)})`,
    description: `Publish your press release on ${site.name}, a ${site.state} news site: $${(PRODUCTS.press_release.cents / 100).toFixed(0)}, live within one business day, permanent, with your logo and website link. For ${site.state} companies, nonprofits and PR agencies.`,
    alternates: { canonical: `https://${site.domain}/press-release` },
  };
}

export default function PressReleasePage({ searchParams }: { searchParams: { paid?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const price = `$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`;
  const faqs: Array<[string, string]> = [
    [`How much does it cost to publish a press release in ${site.state}?`, `${price} per release on ${site.name}. Releases about casinos and 18+ venues are $${(Number(process.env.PRICE_PREMIUM_CENTS || 9900) / 100).toFixed(0)}. There is no subscription.`],
    [`How fast is my press release published?`, `Within one business day after payment. Our editors check every release before it goes live; if we decline it, you get a full refund.`],
    [`Is the press release edited?`, `No. It is published as you wrote it and labelled "Press release", with a note that it was paid for. We only decline releases that break our rules.`],
    [`Does the press release link to my website?`, `Yes. The link is marked as sponsored, as U.S. FTC rules and search engines require for paid content.`],
    [`Can PR agencies send releases for clients?`, `Yes. Agencies can publish as many ${site.state} releases as they need; each is reviewed and billed separately.`],
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "Service", name: `${site.state} press release publishing`, serviceType: "Press release distribution", areaServed: { "@type": "State", name: site.state }, provider: { "@type": "NewsMediaOrganization", name: site.name, url: `https://${site.domain}` }, offers: { "@type": "Offer", price: (PRODUCTS.press_release.cents / 100).toFixed(2), priceCurrency: "USD", url: `https://${site.domain}/press-release` } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[44px]">{site.state} press release distribution: publish on {site.name}</h1>
        <p className="mt-3 text-[17px] text-gray-700">
          Company news, openings, hires, funding, events, product launches: your release published on {site.name} for <b>{price}</b>, in front of {site.state} readers, live within one business day. It stays on the site permanently, with your logo or photo and a link to your website.
        </p>
        <ul className="mt-4 grid gap-2 text-[15px] text-gray-700 sm:grid-cols-2">
          <li>✓ Published as you wrote it, labelled &quot;Press release&quot;</li>
          <li>✓ Link to your website (marked as sponsored)</li>
          <li>✓ Photo or logo, plus your media contact</li>
          <li>✓ Full refund if our editors decline it</li>
        </ul>
        <p className="mt-4 text-[14px] text-gray-600">
          For agencies: send releases about {site.state} as often as you like; each one is reviewed and billed separately. Free news tips and announcements can still be sent through the <a href="/submit" className="underline">submit page</a>; our newsroom decides whether to cover them. We do not publish releases about cannabis, vaping, drugs or supplements, crypto or investment offers, payday loans, adult content, weapons, or anything misleading. Casino and 18+ venue releases are {`$${(Number(process.env.PRICE_PREMIUM_CENTS || 9900) / 100).toFixed(0)}`}.
        </p>
        <a href="https://media-chief.com/packages" target="_blank" rel="noopener" className="mt-6 flex flex-col gap-1 border-2 border-gray-900 bg-white p-5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <span><b className="block text-[17px]">Need national reach? Publish on all 50 state papers at once.</b><span className="text-[14.5px] text-gray-700">One release on every paper of the network, one in every state, live within 24 hours, with a full report of the links.</span></span>
          <span className="mt-2 shrink-0 bg-gray-900 px-4 py-2.5 text-[14px] font-black text-white sm:mt-0">All 50 states: $149 ›</span>
        </a>
        <p className="mt-6 text-[15px]">Guides: <a href="/guides/how-to-write-a-press-release" className="underline">How to write a press release</a> · <a href="/guides/get-your-business-in-the-news" className="underline">Get your business in the news</a> · <a href="/guides/advertise-small-business" className="underline">Advertise a small business</a></p>
        {searchParams.paid && <p className="mt-6 rounded bg-green-50 p-4 font-semibold text-green-900">Payment received, thank you. An editor will review your release within one business day and email you the link.</p>}
        {searchParams.cancelled && <p className="mt-6 rounded bg-yellow-50 p-4 text-yellow-900">Payment was cancelled; nothing was charged.</p>}
        <div className="mt-8"><PaidForm product="press_release" price={price} siteName={site.name} accent={site.accent || "#b91c1c"} /></div>
        <section className="mt-12">
          <h2 className="text-[24px] font-extrabold">Questions about publishing a press release</h2>
          <div className="mt-3 divide-y border-y bg-white">
            {faqs.map(([q, a]) => <details key={q} className="p-4"><summary className="cursor-pointer text-[16.5px] font-bold">{q}</summary><p className="mt-2 text-[15.5px] text-gray-700">{a}</p></details>)}
          </div>
        </section>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
