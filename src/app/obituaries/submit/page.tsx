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
  return { title: `Place an obituary | ${site.name}`, description: `Place an obituary for a loved one in ${site.name}.`, alternates: { canonical: `https://${site.domain}/obituaries/submit` } };
}

export default function ObituarySubmitPage({ searchParams }: { searchParams: { paid?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const price = `$${(PRODUCTS.obituary.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[34px] font-extrabold leading-tight md:text-[44px]">Place an obituary</h1>
        <p className="mt-3 text-[17px] text-gray-700">
          Honor a loved one with an obituary on {site.name} for {price}, with a photo. It stays on the site permanently and can be shared with family and friends.
        </p>
        {searchParams.paid && <p className="mt-6 rounded bg-green-50 p-4 font-semibold text-green-900">Payment received, thank you. We will publish the obituary within one business day.</p>}
        {searchParams.cancelled && <p className="mt-6 rounded bg-yellow-50 p-4 text-yellow-900">Payment was cancelled; nothing was charged.</p>}
        <div className="mt-8"><PaidForm product="obituary" price={price} siteName={site.name} accent={site.accent || "#b91c1c"} /></div>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
