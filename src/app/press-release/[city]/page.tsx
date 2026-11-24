import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteFromHeaders, slugOf } from "@/lib/topic-page";
import { citiesOf } from "@/lib/local-data";
import { siteStories } from "@/lib/related-stories";
import { categoryCounts } from "@/lib/directory";
import { PRODUCTS } from "@/lib/paid";
import { SpecialPage } from "@/lib/special-page";
import PaidForm from "@/components/PaidForm";

/**
 * "Press release distribution in {City}, {ST}": one page per big town of the
 * state, with that town's own recent stories and directory figures, so each
 * page is about its town. Noindex until the paper has 3+ recent stories from
 * the town.
 */
export const dynamic = "force-dynamic";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function load(slug: string) {
  const site = siteFromHeaders();
  const city = citiesOf(site.state).map(([n]) => n).find((n) => slugOf(n) === slug) || null;
  return { site, city };
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const { site, city } = load(params.city);
  if (!city) return { robots: { index: false } };
  const n = (await siteStories(site.slug, `\\m${esc(city)}\\M`, 30, 10)).length;
  const price = `$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`;
  return {
    title: `Press Release Distribution in ${city}, ${site.stateAbbr}: Publish Local News (${price})`,
    description: `Publish your ${city} press release on ${site.name}, the ${site.state} news site: ${price}, live within one business day, permanent, with your logo and website link. For ${city} businesses, nonprofits and PR agencies.`,
    alternates: { canonical: `https://${site.domain}/press-release/${params.city}` },
    robots: n >= 3 ? undefined : { index: false, follow: true },
  };
}

export default async function CityPressRelease({ params }: { params: { city: string } }) {
  const { site, city } = load(params.city);
  if (!city) notFound();
  const counts = await categoryCounts(site.slug, params.city).catch(() => ({} as Record<string, number>));
  const listed = Object.values(counts).reduce((a, b) => a + b, 0);
  const price = `$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`;
  const others = citiesOf(site.state).map(([n]) => n).filter((n) => n !== city);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <SpecialPage
      site={site}
      path={`/press-release/${params.city}`}
      h1={`Press release distribution in ${city}, ${site.stateAbbr}`}
      answer={`${city} businesses, nonprofits and agencies can publish a press release on ${site.name} for ${price}: it goes live within one business day, exactly as written and labelled "Press release", stays online permanently and links to your website. Start your release with the dateline "${city.toUpperCase()}, ${site.stateAbbr}". To reach all 50 states at once, the national package is $149.`}
      storiesTitle={`Recent ${city} news on ${site.name}`}
      storiesPattern={`\\m${esc(city)}\\M`}
      source={`${site.name} · press releases`}
      faqs={[
        [`How do I publish a press release in ${city}?`, `Fill in the form on this page with your release, photo and contact, pay ${price} by card, and ${site.name} publishes it within one business day, labelled as a press release.`],
        [`How much does press release distribution cost in ${city}, ${site.stateAbbr}?`, `${price} on ${site.name}, one-time. Publishing on all 50 state news sites of the network costs $149.`],
        [`What dateline should a ${city} press release use?`, `"${city.toUpperCase()}, ${site.stateAbbr} (${today})" at the start of the first paragraph.`],
        [`Can ${city} nonprofits and agencies use it?`, `Yes. Nonprofits, schools, agencies and companies can publish releases about ${city} and ${site.state}. Each release is reviewed before it goes live.`],
      ]}
    >
      <section>
        <h2 className="text-[24px] font-black">Publish your {city} press release</h2>
        <p className="mt-2 text-[16.5px] text-gray-700">
          {listed > 0 ? `${listed} ${city} businesses are listed in the ${site.name} directory. ` : ""}Openings, new jobs, expansions, events, awards and appointments in {city} reach {site.state} readers on {site.name}. Not sure how to write it? Use “Write it for me” below, or read our <a href="/guides/how-to-write-a-press-release" className="font-semibold underline">press release guide</a>.
        </p>
        <div className="mt-6"><PaidForm product="press_release" price={price} siteName={site.name} accent={site.accent || "#b91c1c"} /></div>
        <a href="/all-50-states" className="mt-6 flex flex-col gap-1 border-2 border-gray-900 bg-white p-5 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
          <span><b className="block text-[17px]">National news from {city}? Publish on all 50 state papers.</b><span className="text-[14.5px] text-gray-700">One release on every paper of the network, live within 24 hours.</span></span>
          <span className="mt-2 shrink-0 bg-gray-900 px-4 py-2.5 text-[14px] font-black text-white sm:mt-0">All 50 states: $149 ›</span>
        </a>
        <nav aria-label="Other towns" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
          <b>Press releases in other {site.state} towns:</b>
          {others.map((n) => <a key={n} href={`/press-release/${slugOf(n)}`} className="hover:underline">{n}</a>)}
        </nav>
      </section>
    </SpecialPage>
  );
}
