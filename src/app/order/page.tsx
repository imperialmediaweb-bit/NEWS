import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getSiteByDomain, getActiveSite, sites } from "@/config/sites";
import { generateContent } from "@/data/generate-content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderForm from "@/components/OrderForm";

export const dynamic = "force-dynamic";

function getSiteFromHeaders() {
  try {
    const list = headers();
    const host = list.get("host") || list.get("x-forwarded-host") || "";
    return getSiteByDomain(host) || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

export function generateMetadata(): Metadata {
  const site = getSiteFromHeaders();
  return {
    title: "Order a campaign",
    description: `Publish your announcement across our network of local news sites covering all 50 states, including ${site.name}.`,
    alternates: { canonical: `https://${site.domain}/order` },
  };
}

export default function OrderPage() {
  const site = getSiteFromHeaders();
  const content = generateContent(site);
  const networkSize = Object.keys(sites).length;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-10 md:py-14">
          <h1
            className="text-3xl md:text-5xl mb-3"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
          >
            Order a campaign
          </h1>
          <p className="text-gray-300 max-w-2xl">
            One announcement, published across local news sites covering every US
            state — written for each market, not copied into it.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-[var(--accent)] rounded-lg p-6 lg:sticky lg:top-[140px]">
              <span
                className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white rounded mb-4"
                style={{ backgroundColor: "var(--accent)", fontFamily: "'Oswald', sans-serif" }}
              >
                Network campaign
              </span>

              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="text-5xl font-black"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  $149
                </span>
                <span className="text-gray-500 text-sm">one-off</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                49 newspapers across the network
              </p>

              <ul className="space-y-3 text-sm text-gray-700">
                <li>
                  <strong>49 published articles</strong>, one on each site, each linking
                  to your page
                </li>
                <li>
                  <strong>Written for each state</strong> — not the same text copied 49
                  times, which is what search engines penalise
                </li>
                <li>
                  <strong>A live report</strong> with every link and publication date,
                  on a private page you can send to anyone
                </li>
                <li>
                  <strong>Submitted for indexing</strong> as each article goes live
                </li>
                <li>
                  <strong>Permanent</strong> — articles stay up; this is not a rental
                </li>
              </ul>

              <p className="text-xs text-gray-500 mt-6 pt-5 border-t border-gray-100 leading-relaxed">
                Every article is clearly labelled as sponsored content, and links are
                marked <code>rel=&quot;sponsored&quot;</code>. That is what the search
                engines require of paid placements — a network that ignores it loses its
                visibility, and then the placements are worth nothing to you either.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <OrderForm site={site} />

            <div className="mt-8 text-sm text-gray-600 space-y-3">
              <h2
                className="text-lg text-gray-900"
                style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}
              >
                How it works
              </h2>
              <p>
                <strong>1.</strong> You send the order. Nothing is published yet.
              </p>
              <p>
                <strong>2.</strong> We review it and email you an invoice. If we
                can&apos;t publish something — claims we can&apos;t stand behind, or
                anything that would mislead a reader — we tell you before you pay, not
                after.
              </p>
              <p>
                <strong>3.</strong> Once paid, publication runs across the {networkSize}{" "}
                sites over the following days. Your report fills in as each one goes
                live.
              </p>
              <p className="pt-2">
                Questions first? <Link href="/contact" className="text-[var(--accent)] underline">Contact us</Link>{" "}
                or see the{" "}
                <Link href="/advertise" className="text-[var(--accent)] underline">
                  full advertising options
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer site={site} about={content.footerAbout} />
    </div>
  );
}
