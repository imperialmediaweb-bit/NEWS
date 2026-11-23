import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { citiesOf } from "@/lib/local-data";
import { PRODUCTS } from "@/lib/paid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import ListingForm from "@/components/ListingForm";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return { title: `List Your Business on ${site.name}`, alternates: { canonical: `https://${site.domain}/directory/join` }, robots: { index: false, follow: true } };
}

export default function JoinDirectory({ searchParams }: { searchParams: { paid?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const price = `$${(PRODUCTS.listing.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[32px] font-black leading-tight md:text-[44px]">List your business on {site.name}</h1>
        <p className="mt-3 text-[17px] text-gray-700">Your business in the {site.state} directory: name, category, town, description, phone, website and logo. {price} a month, cancel any time. Our staff reviews every listing before it goes live; if we decline it, you get a full refund.</p>
        {searchParams.paid && <p className="mt-5 bg-green-50 p-4 font-semibold text-green-800">Thank you! Your payment went through. We will review your listing within one business day and email you when it is live.</p>}
        {searchParams.cancelled && <p className="mt-5 bg-amber-50 p-4 font-semibold text-amber-800">Payment was cancelled. Nothing was charged.</p>}
        {!searchParams.paid && <ListingForm siteName={site.name} price={price} cities={citiesOf(site.state).map(([n]) => n)} />}
        <p className="mt-6 text-[14px] text-gray-500">We don&apos;t list adult services, drugs or pills, weapons, or anything illegal. Questions? Use the <a href="/contact" className="underline">contact page</a>.</p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
