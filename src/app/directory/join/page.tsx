import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { citiesOf } from "@/lib/local-data";
import { PRODUCTS } from "@/lib/paid";
import { getBusiness } from "@/lib/directory";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import JoinForm from "@/components/directory/JoinForm";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return { title: `Add or Claim Your Business on ${site.name}`, description: `Free listing in the ${site.state} business directory, or Business Spotlight: top of the list for 12 months plus a profile article.`, alternates: { canonical: `https://${site.domain}/directory/join` } };
}

export default async function JoinDirectory({ searchParams }: { searchParams: { paid?: string; cancelled?: string; b?: string } }) {
  const site = siteFromHeaders();
  const b = searchParams.b && !searchParams.paid ? await getBusiness(site.slug, searchParams.b) : null;
  const initial = b ? { slug: b.slug, name: b.name, category: b.category, city: b.city, address: b.address || "", zip: b.zip || "", phone: b.phone || "", website: b.website || "", hours: b.hours || "", description: b.description || "", facebook: b.facebook || "", instagram: b.instagram || "" } : null;
  const usd = (c: number) => `$${(c / 100).toFixed(0)}`;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[920px] px-4 py-10">
        <h1 className="text-[32px] font-black leading-tight md:text-[46px]">{b ? `Claim ${b.name}` : `Put your business on ${site.name}`}</h1>
        <p className="mt-3 text-[17px] text-gray-700">Get found by {site.state} readers looking for local services. A free listing takes two minutes. <b>Business Spotlight</b> puts you at the top of your town&apos;s list for 12 months and publishes a profile article about your business, for a single payment.</p>
        {searchParams.paid && <p className="mt-6 bg-green-50 p-5 text-[16px] font-semibold text-green-800">Thank you! Your payment went through. Your listing is upgraded now, and your Spotlight article goes live within 24 hours. We&apos;ll email you the link.</p>}
        {searchParams.cancelled && <p className="mt-6 bg-amber-50 p-4 font-semibold text-amber-800">Payment cancelled. Nothing was charged.</p>}
        {!searchParams.paid && <JoinForm siteName={site.name} state={site.state} cities={citiesOf(site.state).map(([n]) => n)} initial={initial} prices={{ spotlight: usd(PRODUCTS.spotlight.cents), home: usd(PRODUCTS.spotlight_home.cents) }} />}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
