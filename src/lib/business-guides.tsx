import type { SiteConfig } from "@/config/site-config";
import { citiesOf } from "@/lib/local-data";
import { categoryCounts, topCities } from "@/lib/directory";
import { PRODUCTS } from "@/lib/paid";

/**
 * Data that makes each paper's business guides its own: the state's towns,
 * how many businesses its directory lists, the busiest directory towns and
 * the paper's prices. The guides read the same way on every paper, but the
 * facts in them are that state's.
 */
export async function guideData(site: SiteConfig) {
  const cities = citiesOf(site.state).map(([n]) => n);
  const [counts, top] = await Promise.all([categoryCounts(site.slug).catch(() => ({} as Record<string, number>)), topCities(site.slug, 6).catch(() => [])]);
  const listed = Object.values(counts).reduce((a, b) => a + b, 0);
  const usd = (c: number) => `$${(c / 100).toFixed(0)}`;
  return {
    cities,
    bigCities: cities.slice(0, 5),
    listed,
    topTowns: top.map((t) => t.city),
    price: { sponsored: usd(PRODUCTS.sponsored.cents), release: usd(PRODUCTS.press_release.cents), spotlight: usd(PRODUCTS.spotlight.cents), home: usd(PRODUCTS.spotlight_home.cents), obituary: usd(PRODUCTS.obituary.cents) },
  };
}

export const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function GuideCTA({ site, price }: { site: SiteConfig; price: Awaited<ReturnType<typeof guideData>>["price"] }) {
  return (
    <aside className="mt-10 grid gap-3 sm:grid-cols-3">
      {[
        ["Press release", price.release, "/press-release", "Published as written, live in one business day"],
        ["Sponsored story", price.sponsored, "/promote", "We publish your story, labelled sponsored"],
        ["Business Spotlight", price.spotlight, "/directory/join", `Top of the ${site.state} directory for 12 months`],
      ].map(([name, p, href, sub]) => (
        <a key={href} href={href} className="block border-t-[5px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--sp-acc)" }}>
          <b className="block text-[16px]">{name}</b>
          <span className="mt-1 block text-[28px] font-black">{p}</span>
          <span className="text-[13.5px] text-gray-600">{sub} ›</span>
        </a>
      ))}
    </aside>
  );
}

export const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="mt-9 text-[24px] font-black md:text-[28px]">{children}</h2>;
export const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[17px] leading-relaxed text-gray-800">{children}</p>;
