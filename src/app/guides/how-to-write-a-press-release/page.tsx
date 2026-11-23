import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { SpecialPage } from "@/lib/special-page";
import { guideData, list, GuideCTA, H2, P } from "@/lib/business-guides";

export const dynamic = "force-dynamic";
const PATH = "/guides/how-to-write-a-press-release";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `How to Write a Press Release ${site.state} Newspapers Will Publish (Template)`,
    description: `A step-by-step press release template for ${site.state} businesses and organizations: headline, dateline, quotes, boilerplate and contact, plus where to publish it in ${site.state}.`,
    alternates: { canonical: `https://${site.domain}${PATH}` },
  };
}

export default async function Guide() {
  const site = siteFromHeaders();
  const d = await guideData(site);
  const town = d.bigCities[0] || site.state;
  return (
    <SpecialPage
      site={site}
      path={PATH}
      h1={`How to write a press release ${site.state} papers will publish`}
      answer={`Start with a headline that states the news, then a dateline (${town.toUpperCase()}, ${site.stateAbbr}, and the date), a first paragraph with who, what, where, when and why, one or two quotes from a named person, the details with numbers, a short "About" paragraph and a media contact. Keep it under 600 words. You can publish it on ${site.name} as written for ${d.price.release}.`}
      storiesTitle={`Press releases and business news on ${site.name}`}
      storiesPattern="(announce|launch|open|expan|hire|names|appoint|award|partner|grant|invest)"
      source={`A guide from ${site.name}`}
      faqs={[
        [`How long should a press release be?`, `300 to 600 words. Editors in ${site.state} decide in the first two sentences whether a release is news.`],
        [`What is a dateline in a press release?`, `The city and state where the news happens, followed by the date, at the start of the first paragraph, for example "${town.toUpperCase()}, ${site.stateAbbr} (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})".`],
        [`Where can I publish a press release in ${site.state}?`, `${site.name} publishes press releases as written for ${d.price.release}, live within one business day, labelled as a press release. For all 50 states at once, the network package is $149.`],
        [`Should a press release include a photo?`, `Yes, if you own it: one landscape photo, at least 1200 pixels wide, with a caption that names the people in it.`],
      ]}
    >
      <article>
        <H2>The structure, step by step</H2>
        <ol className="mt-3 list-decimal space-y-3 pl-6 text-[17px] text-gray-800">
          <li><b>Headline:</b> the news in under 12 words. &quot;{town} bakery adds 20 jobs with second location&quot;, not &quot;Exciting news from our team&quot;.</li>
          <li><b>Dateline:</b> {town.toUpperCase()}, {site.stateAbbr}, followed by the date.</li>
          <li><b>First paragraph:</b> who, what, where, when and why, in two sentences.</li>
          <li><b>Quote:</b> one or two sentences from a named person with a title.</li>
          <li><b>Details:</b> numbers, dates, addresses, prices, how people take part.</li>
          <li><b>About:</b> three lines on the business or organization.</li>
          <li><b>Media contact:</b> name, phone, email.</li>
        </ol>
        <H2>A template you can copy</H2>
        <pre className="mt-3 whitespace-pre-wrap border bg-white p-4 text-[14.5px] leading-relaxed">{`[HEADLINE: what happened, in under 12 words]

${town.toUpperCase()}, ${site.stateAbbr} ([Month Day, Year]) - [Business name], a [what you do] in [town], today [announced / opened / hired / received] [the news]. [Why it matters to people in ${town} or nearby towns].

"[One or two sentences]," said [Full Name], [title] of [Business name].

[Details: dates, times, address, numbers, how to take part.]

About [Business name]
[Three lines: what you do, since when, where you serve in ${site.state}.]

Media contact: [Name], [phone], [email]`}</pre>
        <H2>Mistakes that get releases ignored</H2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-[17px] text-gray-800">
          <li>No local angle: say which {site.state} towns it affects, such as {list(d.bigCities.slice(0, 3))}.</li>
          <li>Superlatives without proof (&quot;the best&quot;, &quot;world-class&quot;).</li>
          <li>Missing names, dates or a phone number.</li>
          <li>A sales pitch: discounts and offers belong in an ad or a sponsored story.</li>
        </ul>
        <H2>Publish it in {site.state}</H2>
        <P>Send it free to {site.name} through the <a href="/submit" className="font-semibold underline">submit page</a> and our editors decide whether to cover it, or publish it exactly as written for {d.price.release}, live within one business day.</P>
        <GuideCTA site={site} price={d.price} />
        <p className="mt-6 text-[15px]">More guides: <a href="/guides/get-your-business-in-the-news" className="underline">How to get your business in the news in {site.state}</a> · <a href="/guides/advertise-small-business" className="underline">How to advertise a small business in {site.state}</a></p>
      </article>
    </SpecialPage>
  );
}
