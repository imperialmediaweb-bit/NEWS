import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";
import { guideData, list, GuideCTA, H2, P } from "@/lib/business-guides";

export const dynamic = "force-dynamic";
const PATH = "/guides/get-your-business-in-the-news";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `How to Get Your Business in the News in ${site.state} (${new Date().getFullYear()} Guide)`,
    description: `How ${site.state} businesses get covered by local news: what newsrooms look for, how to pitch, when to send a press release and what it costs to publish on ${site.name}.`,
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
      h1={`How to get your business in the news in ${site.state}`}
      answer={`Give a ${site.state} newsroom something new and local: an opening, an expansion, new jobs, an award, a community event or a fundraiser in ${list(d.bigCities.slice(0, 3))} or another ${site.state} town. Send a short, factual pitch or press release with names, dates and a contact. If you need the news published for sure, ${site.name} publishes press releases as written for ${d.price.release}.`}
      storiesTitle={`${site.state} business news on ${site.name}`}
      storiesPattern="(open|opening|expan|hire|hiring|jobs|invest|plant|company|business|store|restaurant|grant|award|launch|acquir|headquarter)"
      source={`A guide from ${site.name}`}
      faqs={[
        [`How do I get my ${site.state} business featured in the local news?`, `Send the newsroom a short pitch about something new and local, with names, dates, numbers and a contact person. ${site.name} reads every tip sent through its submit page; editors decide what to cover.`],
        [`Is it free to be in the news?`, `News coverage is free when editors decide a story is news. If you need a guaranteed publication, a press release on ${site.name} costs ${d.price.release} and a sponsored story ${d.price.sponsored}, both clearly labelled.`],
        [`What makes local news editors cover a business?`, `New jobs, openings and closings, expansions, local investment, awards, community events and anything that affects people in ${list(d.bigCities.slice(0, 3))} or nearby towns.`],
        [`How long before my story appears?`, `Paid press releases and sponsored stories on ${site.name} go live within one business day. Free tips are covered only if an editor picks them.`],
      ]}
    >
      <article>
        <H2>What {site.state} newsrooms look for</H2>
        <P>Local editors in {site.state} cover what changes life in their towns. A business story gets picked when it has one of these: new jobs or layoffs, an opening, a move or an expansion, money coming into the community (an investment, a grant, a new plant), an award, or an event that people in {list(d.bigCities)} can attend.</P>
        <P>A grand opening in {d.bigCities[0] || site.state} is news; a sale is advertising. If what you have is a promotion, a discount or a product, it belongs in a sponsored story, not in a news pitch.</P>
        <H2>How to pitch a local story</H2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-[17px] text-gray-800">
          <li><b>Lead with the news</b> in one sentence: who, what, where in {site.state}, when.</li>
          <li><b>Give the numbers:</b> jobs, dollars, square feet, dates, people served.</li>
          <li><b>Name a person</b> who can talk to a reporter today, with phone and email.</li>
          <li><b>Add one good photo</b> you own, landscape, at least 1200 pixels wide.</li>
          <li><b>Send it early:</b> a week before an event, the morning of an announcement.</li>
        </ol>
        <P>Send tips to {site.name} through the <a href="/submit" className="font-semibold underline">submit page</a>. Our editors read every one.</P>
        <H2>When to use a press release instead</H2>
        <P>A press release is the right tool when the wording matters (a funding round, a leadership change, a legal or medical announcement) or when you need the news online by a certain date. On {site.name} a press release is published exactly as you write it, labelled &quot;Press release&quot;, for {d.price.release}. To be on all 50 state papers at once, the network package costs $149.</P>
        <H2>Be found by {site.state} customers every day</H2>
        <P>{d.listed > 0 ? `${d.listed.toLocaleString("en-US")} ${site.state} businesses are listed in the ${site.name} business directory${d.topTowns.length ? `, most of them in ${list(d.topTowns.slice(0, 4))}` : ""}.` : `The ${site.name} business directory lists ${site.state} businesses town by town.`} A free listing takes two minutes; Business Spotlight puts you at the top of your town&apos;s list for 12 months, with a profile article, for {d.price.spotlight}.</P>
        <GuideCTA site={site} price={d.price} />
        <p className="mt-6 text-[15px]">More guides: <a href="/guides/how-to-write-a-press-release" className="underline">How to write a press release</a> · <a href="/guides/advertise-small-business" className="underline">How to advertise a small business in {site.state}</a></p>
      </article>
    </SpecialPage>
  );
}
