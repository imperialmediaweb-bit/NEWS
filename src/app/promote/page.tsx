import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import PaidForm from "@/components/PaidForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { PRODUCTS } from "@/lib/paid";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return { title: `Promote your business | ${site.name}`, description: `Tell ${site.state} about your business with a sponsored story on ${site.name}.`, alternates: { canonical: `https://${site.domain}/promote` } };
}

export default function PromotePage({ searchParams }: { searchParams: { paid?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const price = `$${(PRODUCTS.sponsored.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[44px]">Promote your business</h1>
        <p className="mt-3 text-[17px] text-gray-700">
          A grand opening, a new service, an event or a milestone: publish a sponsored story on {site.name} for {price}. It stays on the site, is labelled &quot;Sponsored&quot;, and links to your website.
        </p>
        <p className="mt-3 text-[14px] text-gray-600">
          We accept announcements from real local businesses, events and organizations. Casinos, gaming and 18+ shows (burlesque, cabaret, nightclubs) are welcome at $99 from licensed venues. We do not publish ads for cannabis, CBD or vaping, drugs, pills or supplements, crypto or investment offers, payday loans, adult content, escorts or dating services, weapons, tobacco, or SEO link selling.
        </p>
        {searchParams.paid && <p className="mt-6 rounded bg-green-50 p-4 font-semibold text-green-900">Payment received, thank you. An editor will review your story within one business day.</p>}
        {searchParams.cancelled && <p className="mt-6 rounded bg-yellow-50 p-4 text-yellow-900">Payment was cancelled; nothing was charged.</p>}
        <div className="mt-8"><PaidForm product="sponsored" price={price} siteName={site.name} accent={site.accent || "#b91c1c"} /></div>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
