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
    title: `Publish Your Press Release on ${site.name}`,
    description: `Publish a press release on ${site.name} and reach ${site.state} readers. ${`$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`}, live within one business day, labelled as a press release.`,
    alternates: { canonical: `https://${site.domain}/press-release` },
  };
}

export default function PressReleasePage({ searchParams }: { searchParams: { paid?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const price = `$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[44px]">Publish your press release on {site.name}</h1>
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
        {searchParams.paid && <p className="mt-6 rounded bg-green-50 p-4 font-semibold text-green-900">Payment received, thank you. An editor will review your release within one business day and email you the link.</p>}
        {searchParams.cancelled && <p className="mt-6 rounded bg-yellow-50 p-4 text-yellow-900">Payment was cancelled; nothing was charged.</p>}
        <div className="mt-8"><PaidForm product="press_release" price={price} siteName={site.name} accent={site.accent || "#b91c1c"} /></div>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
