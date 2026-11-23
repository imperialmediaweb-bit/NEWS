import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { PRODUCTS } from "@/lib/paid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

/** Directory terms: where the listings come from, removal and corrections, Business Spotlight, reviews. */
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return { title: `Business Directory Terms & Data Sources | ${site.name}`, alternates: { canonical: `https://${site.domain}/directory/terms` } };
}

export default function DirectoryTerms() {
  const site = siteFromHeaders();
  const usd = (c: number) => `$${(c / 100).toFixed(0)}`;
  const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-9 text-[22px] font-black">{children}</h2>;
  const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[16.5px] leading-relaxed text-gray-800">{children}</p>;
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[820px] px-4 py-10">
        <h1 className="text-[32px] font-black leading-tight md:text-[44px]">Business directory: terms and data sources</h1>
        <p className="mt-2 text-[14px] text-gray-500">Applies to the {site.name} business directory at {site.domain}/directory. Last updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>

        <H>1. Where the listings come from</H>
        <P>Listings in the directory come from three places:</P>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-[16.5px] text-gray-800">
          <li><b>OpenStreetMap.</b> Many basic listings (business name, category, address, phone, website, opening hours) come from <a href="https://www.openstreetmap.org/copyright" className="underline" rel="noopener" target="_blank">OpenStreetMap</a>, a public map built by volunteers. That data is © OpenStreetMap contributors and is available under the <a href="https://opendatacommons.org/licenses/odbl/" className="underline" rel="noopener" target="_blank">Open Database License (ODbL)</a>. We credit OpenStreetMap on every directory page.</li>
          <li><b>Business owners</b>, who add, claim or correct their own listing.</li>
          <li><b>Readers</b>, who write reviews after confirming their email address.</li>
        </ul>
        <P>We do not copy listings, photos or reviews from Google, Yelp or any other website.</P>
        <P><b>Open data.</b> As the ODbL requires, the directory data we derived from OpenStreetMap is available under the same license. To receive a copy, write to us through the <a href="/contact" className="underline">contact page</a>.</P>

        <H>2. Accuracy</H>
        <P>Business details change, and data from public sources can be out of date. We show listings as information, not as a recommendation. Before you hire a business or visit it, confirm the details with the business. A listing does not mean that {site.name} endorses, has checked or works with that business.</P>

        <H>3. Corrections and removal (always free)</H>
        <P>If you own or manage a business that is listed, you can:</P>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-[16.5px] text-gray-800">
          <li><b>Correct it</b> for free: use &quot;Claim this listing&quot; on the business page.</li>
          <li><b>Remove it</b> for free: use &quot;Remove this listing&quot; on the business page. We remove listings within one business day of the request.</li>
        </ul>
        <P>Anyone can report a mistake with &quot;Report a change&quot;. If a business is removed, its reader reviews are no longer shown.</P>

        <H>4. Free listings</H>
        <P>Owners can add a business for free. Our staff checks every new listing and every claim before it goes live. We can refuse or remove listings that are false, misleading or outside these terms.</P>

        <H>5. Business Spotlight (paid)</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-[16.5px] text-gray-800">
          <li><b>Business Spotlight, {usd(PRODUCTS.spotlight.cents)}</b>, one-time payment: for 12 months, the business appears at the top of its town and category lists, with a &quot;Featured&quot; label, photo and website link, and a badge for its own website. It includes one profile article on {site.name}.</li>
          <li><b>Spotlight + Homepage, {usd(PRODUCTS.spotlight_home.cents)}</b>, one-time payment: everything in Business Spotlight, plus 7 days in the featured spot on the {site.name} homepage.</li>
          <li><b>No subscription.</b> Nothing renews automatically. After 12 months the listing becomes a free listing again unless the owner buys Spotlight again.</li>
          <li><b>Clearly labelled.</b> Under U.S. Federal Trade Commission rules, the profile article is labelled &quot;Sponsored&quot; and says the business paid for it. Links in paid content are marked as sponsored for search engines. The newsroom does not report or endorse Spotlight content.</li>
          <li><b>The article is written from information the business provides</b>, with an optional writing assistant. The business is responsible for the facts it gives us. It goes live within 24 hours of payment unless we decline it.</li>
          <li><b>Refunds.</b> If we decline a Spotlight before it is published, we refund it in full. If you ask before the article is published, we refund it in full. After publication, payment is not refundable, but you can ask us at any time to correct the article or remove the listing.</li>
          <li><b>What we don&apos;t accept, free or paid:</b> adult services, cannabis, vape or tobacco shops, weapons, gambling, drugs or pills, and anything illegal or deceptive.</li>
          <li><b>Paying does not buy reviews.</b> A paid business cannot remove, hide or edit honest reviews, and gets no better or worse treatment in reviews.</li>
        </ul>

        <H>6. Reader reviews</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-[16.5px] text-gray-800">
          <li>Reviews must describe a real experience with the business. One review per person per business, published only after the reviewer confirms their email address. Email addresses are never shown.</li>
          <li>We never write, buy or sell reviews, and businesses may not offer anything in exchange for a review, or review themselves or competitors. This follows the FTC rule on consumer reviews (16 CFR Part 465).</li>
          <li>We remove reviews only when they are spam, threats, hate speech, personal information, clearly not about a real experience, or illegal. We do not remove honest negative reviews.</li>
          <li>Reviews are the opinions of the readers who wrote them, not of {site.name}.</li>
        </ul>

        <H>7. Contact</H>
        <P>Questions, corrections, removal requests or requests for the open data: use the <a href="/contact" className="underline">contact page</a> or the buttons on each business page.</P>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
