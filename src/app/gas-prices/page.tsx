import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { getGasPrices } from "@/lib/local-data";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

export const dynamic = "force-dynamic";

/** "{State} gas prices today": the U.S. Energy Information Administration's weekly retail prices. */
export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} Gas Prices Today`,
    description: `Average gas prices for ${site.state} this week, regular, midgrade, premium and diesel, with the change from last week. Data from the U.S. Energy Information Administration.`,
    alternates: { canonical: `https://${site.domain}/gas-prices` },
  };
}

export default async function GasPricesPage() {
  const site = siteFromHeaders();
  const gas = await getGasPrices(site.state).catch(() => null);
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[860px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[44px]">{site.state} gas prices today</h1>
        {gas ? (
          <>
            <p className="mt-2 text-[15px] text-gray-600">
              Week of {gas.week}. {gas.isRegion ? `The EIA publishes ${site.state} as part of its ${gas.area} region; these are the regional averages.` : `Statewide averages for ${gas.area}.`}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {gas.grades.map((g) => (
                <div key={g.grade} className="rounded-lg bg-white p-5 shadow-sm">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-gray-500">{g.grade}</p>
                  <p className="mt-1 text-[44px] font-extrabold leading-none">${g.price.toFixed(3)}</p>
                  <p className={`mt-2 text-[15px] font-semibold ${g.change > 0 ? "text-red-700" : g.change < 0 ? "text-green-700" : "text-gray-600"}`}>
                    {g.change > 0 ? "▲" : g.change < 0 ? "▼" : "•"} {Math.abs(g.change).toFixed(3)} from last week
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[14px] text-gray-500">Source: U.S. Energy Information Administration, weekly retail gasoline and diesel prices, updated on Mondays.</p>
          </>
        ) : (
          <p className="mt-6 text-gray-600">Gas prices are not available right now. Please check back shortly.</p>
        )}
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
