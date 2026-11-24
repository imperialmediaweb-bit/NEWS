import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders } from "@/lib/topic-page";
import { getBusiness } from "@/lib/directory";
import { PRODUCTS } from "@/lib/paid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import DealForm from "@/components/directory/DealForm";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return { title: "Post a deal", robots: { index: false, follow: true } }; }

export default async function DealPage({ searchParams }: { searchParams: { b?: string; cancelled?: string } }) {
  const site = siteFromHeaders();
  const b = searchParams.b ? await getBusiness(site.slug, searchParams.b) : null;
  if (!b) notFound();
  const price = `$${(PRODUCTS.deal.cents / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[760px] px-4 py-10">
        <p className="text-[13px] font-black uppercase tracking-[.2em] text-gray-500">{b.name} · {b.city}</p>
        <h1 className="mt-1 text-[32px] font-black leading-tight md:text-[42px]">Post a deal or coupon</h1>
        <p className="mt-3 text-[17px] text-gray-700">Your offer shows on your page, at the top of your listing in {b.city} and on the {site.state} deals page, for up to 30 days. {price}, one payment, live as soon as you pay.</p>
        {searchParams.cancelled && <p className="mt-5 bg-amber-50 p-4 font-semibold text-amber-800">Payment cancelled. Nothing was charged.</p>}
        <DealForm slug={b.slug} price={price} siteName={site.name} accent={site.accent || "#b91c1c"} />
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
