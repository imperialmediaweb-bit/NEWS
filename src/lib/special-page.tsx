import type { SiteConfig } from "@/config/site-config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import { siteStories, storyHref } from "@/lib/related-stories";
import { TZ } from "@/config/timezones";

/**
 * Shared frame for the state-only pages (hurricane tracker, football scores,
 * surf report…): the answer first, written from live data; the data; the
 * site's own stories; questions people search, with FAQPage structured data;
 * the source and the time it was updated. Built for Google and for AI answers.
 */
export type Faq = [string, string];

export async function SpecialPage({ site, path, h1, answer, children, storiesTitle, storiesPattern, faqs, source }: {
  site: SiteConfig;
  path: string;
  h1: string;
  answer: string;
  children?: React.ReactNode;
  storiesTitle: string;
  storiesPattern: string;
  faqs: Faq[];
  source: string;
}) {
  const stories = await siteStories(site.slug, storiesPattern, 30, 10);
  const tz = TZ[site.state] || "America/New_York";
  const updated = new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" });
  const url = `https://${site.domain}${path}`;
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: h1, url, dateModified: new Date().toISOString(), description: answer, publisher: { "@type": "NewsMediaOrganization", name: site.name, url: `https://${site.domain}` } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <main className="mx-auto max-w-[980px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[44px]">{h1}</h1>
        <p className="mt-1 text-[14px] text-gray-500">Updated {updated} · {source}</p>
        <p className="mt-4 max-w-[780px] text-[18px] leading-relaxed">{answer}</p>
        {children && <div className="mt-6">{children}</div>}
        {stories.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[22px] font-extrabold">{storiesTitle}</h2>
            <ul className="mt-3 space-y-2">{stories.map((a) => <li key={a.slug}><a href={storyHref(a)} className="text-[16px] font-semibold hover:underline">{a.title}</a></li>)}</ul>
          </section>
        )}
        <section className="mt-10">
          <h2 className="text-[22px] font-extrabold">Questions people ask</h2>
          <div className="mt-3 divide-y rounded bg-white shadow-sm">
            {faqs.map(([q, a]) => <details key={q} className="p-4"><summary className="cursor-pointer text-[16px] font-bold">{q}</summary><p className="mt-2 text-[15.5px] text-gray-700">{a}</p></details>)}
          </div>
        </section>
        <p className="mt-6 text-[14px] text-gray-500">Know something we should add? <a href="/submit" className="underline">Tell the {site.name} newsroom</a>.</p>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}

export const Table = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto rounded bg-white shadow-sm">
    <table className="w-full text-left text-[15px]">
      <thead className="border-b text-[12px] uppercase tracking-wide text-gray-500"><tr>{head.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
      <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`p-3 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);
