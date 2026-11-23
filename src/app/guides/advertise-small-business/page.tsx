import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage, Table } from "@/lib/special-page";
import { guideData, list, GuideCTA, H2, P } from "@/lib/business-guides";

export const dynamic = "force-dynamic";
const PATH = "/guides/advertise-small-business";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `How to Advertise a Small Business in ${site.state}: Cheap Options & Prices (${new Date().getFullYear()})`,
    description: `Affordable ways to advertise a small business in ${site.state}: free listings, local news, sponsored stories and press releases, with real prices from ${site.name}.`,
    alternates: { canonical: `https://${site.domain}${PATH}` },
  };
}

export default async function Guide() {
  const site = siteFromHeaders();
  const d = await guideData(site);
  return (
    <SpecialPage
      site={site}
      path={PATH}
      h1={`How to advertise a small business in ${site.state}`}
      answer={`Start free: a Google Business Profile, a free listing in the ${site.name} business directory and news tips to local papers. Then spend where ${site.state} customers read: a sponsored story on ${site.name} costs ${d.price.sponsored}, a press release ${d.price.release} and a 12-month Business Spotlight ${d.price.spotlight}, each a single payment with no contract.`}
      storiesTitle={`${site.state} small business news`}
      storiesPattern="(small business|shop|store|restaurant|bakery|brewery|cafe|salon|open|opening|local business|owner)"
      source={`A guide from ${site.name}`}
      faqs={[
        [`What is the cheapest way to advertise a small business in ${site.state}?`, `Free options first: a Google Business Profile, a free listing in the ${site.name} directory and news tips. The cheapest paid options on ${site.name} are a press release or sponsored story (${d.price.sponsored}) and Business Spotlight (${d.price.spotlight} for 12 months).`],
        [`Do local news ads work for small businesses?`, `They work best for local news people care about: openings, events, new services. A sponsored story stays online permanently and links to your website.`],
        [`Is there a contract?`, `No. Every ${site.name} product is a one-time card payment, refunded in full if we decline it.`],
        [`Can I advertise in other states too?`, `Yes: the network package publishes one article on all 50 state papers for $149.`],
      ]}
    >
      <article>
        <H2>Free first</H2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-[17px] text-gray-800">
          <li><b>Google Business Profile:</b> free, shows you on Google Maps in {list(d.bigCities.slice(0, 3))}.</li>
          <li><b>{site.name} business directory:</b> a free listing with phone, hours, website and reader reviews{d.listed > 0 ? `, alongside ${d.listed.toLocaleString("en-US")} other ${site.state} businesses` : ""}. <a href="/directory/join" className="font-semibold underline">Add yours</a>.</li>
          <li><b>News tips:</b> openings, new jobs and events can be covered for free. <a href="/guides/get-your-business-in-the-news" className="font-semibold underline">How to pitch</a>.</li>
        </ul>
        <H2>Paid options on {site.name}</H2>
        <div className="mt-3"><Table head={["Option", "Price", "What you get"]} rows={[
          ["Press release", d.price.release, "Published as written, labelled, live in one business day"],
          ["Sponsored story", d.price.sponsored, "Your story with photo and website link, labelled sponsored"],
          ["Sponsored story + homepage", `${d.price.sponsored} + $100`, "7 days in the featured spot on the homepage"],
          ["Business Spotlight", d.price.spotlight, `Top of your town in the ${site.state} directory for 12 months + profile article`],
          ["Spotlight + homepage", d.price.home, "Spotlight plus 7 days on the homepage"],
          ["All 50 state papers", "$149", "One article on every paper of the network"],
        ]} /></div>
        <H2>What works best for {site.state} businesses</H2>
        <P>Restaurants, salons, contractors and shops in {list(d.topTowns.length ? d.topTowns.slice(0, 4) : d.bigCities.slice(0, 4))} get the most from being easy to find when someone searches for their service, and from a story when something actually happens: an opening, a new location, a milestone. Combine a Business Spotlight, so you are at the top of your town&apos;s list, with one sponsored story or press release when you have news.</P>
        <P>Rules: paid content on {site.name} is always labelled, as U.S. FTC rules require. We do not accept cannabis, vaping, supplements, crypto offers, payday loans, adult content or weapons.</P>
        <GuideCTA site={site} price={d.price} />
        <p className="mt-6 text-[15px]">More guides: <a href="/guides/get-your-business-in-the-news" className="underline">Get your business in the news</a> · <a href="/guides/how-to-write-a-press-release" className="underline">How to write a press release</a></p>
      </article>
    </SpecialPage>
  );
}
