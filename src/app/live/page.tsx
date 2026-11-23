import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { getAllStateAlerts } from "@/lib/local-data";
import { TZ } from "@/config/timezones";
import { mockupOf } from "@/config/design-cfg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";
import LiveRefresh from "@/components/design/LiveRefresh";

/**
 * "{State} news live": today's stories and the active National Weather Service
 * alerts as one timeline, newest first, refreshing itself every minute. Marked
 * up as a LiveBlogPosting so search engines can show it as live coverage.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} News Live: Today's Updates`,
    description: `Live ${site.state} news today: every story from ${site.name} and official weather alerts as they happen, updated every minute.`,
    alternates: { canonical: `https://${site.domain}/live` },
  };
}

type Entry = { at: string; kind: "story" | "alert"; title: string; text: string; href?: string; image?: string | null; label: string };

export default async function LivePage() {
  const site = siteFromHeaders();
  const tz = TZ[site.state] || "America/New_York";
  const [{ rows }, alerts] = await Promise.all([
    pool.query(
      `SELECT a.title, a.slug, a.category, a.summary, a.featured_image, a.published_at FROM articles a JOIN sites s ON s.id = a.site_id
        WHERE s.slug = $1 AND a.published_at > now() - interval '24 hours' ORDER BY a.published_at DESC LIMIT 60`,
      [site.slug]
    ).catch(() => ({ rows: [] as Array<Record<string, string>> })),
    getAllStateAlerts(site.stateAbbr).catch(() => null),
  ]);
  const entries: Entry[] = [
    ...rows.map((r) => ({ at: new Date(r.published_at).toISOString(), kind: "story" as const, title: r.title, text: String(r.summary || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240), href: `/${r.category}/${r.slug}`, image: r.featured_image, label: String(r.category).replace(/-/g, " ") })),
    ...((alerts || []).filter((a) => a.effective && Date.now() - new Date(a.effective).getTime() < 86400000).map((a) => ({ at: new Date(a.effective).toISOString(), kind: "alert" as const, title: a.event, text: `${a.area}${a.expires ? `. Until ${new Date(a.expires).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: tz })}` : ""}.`, href: "/alerts", label: "Weather alert" }))),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  const url = `https://${site.domain}/live`;
  const ld = {
    "@context": "https://schema.org", "@type": "LiveBlogPosting", headline: `${site.state} news live: today's updates`, url,
    coverageStartTime: entries.at(-1)?.at || new Date().toISOString(), coverageEndTime: new Date(Date.now() + 86400000).toISOString(),
    dateModified: entries[0]?.at || new Date().toISOString(),
    publisher: { "@type": "NewsMediaOrganization", name: site.name, url: `https://${site.domain}` },
    liveBlogUpdate: entries.slice(0, 30).map((e) => ({ "@type": "BlogPosting", headline: e.title, datePublished: e.at, url: e.href ? `https://${site.domain}${e.href}` : url, ...(e.image ? { image: e.image } : {}) })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Header site={site} />
      <section className="text-white" style={{ background: ink }}>
        <div className="mx-auto max-w-[900px] px-4 py-10">
          <p className="flex items-center gap-2 text-[13px] font-black uppercase tracking-[.22em]">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" /></span>
            Live · updated every minute
          </p>
          <h1 className="mt-3 text-[36px] font-black leading-[1.05] md:text-[56px]">{site.state} news live</h1>
          <p className="mt-3 text-[17px] opacity-85">{entries.length} updates in the last 24 hours from {site.name} and the National Weather Service.</p>
        </div>
      </section>
      <main className="mx-auto max-w-[900px] px-4 py-10">
        <ol className="relative border-l-4 pl-6 md:pl-8" style={{ borderColor: acc }}>
          {entries.map((e, i) => (
            <li key={i} className="relative mb-8">
              <span className="absolute -left-[37px] top-1 h-4 w-4 rounded-full border-4 border-white md:-left-[45px]" style={{ background: e.kind === "alert" ? "#dc2626" : acc, boxShadow: `0 0 0 2px ${e.kind === "alert" ? "#dc2626" : acc}` }} />
              <p className="text-[13px] font-black uppercase tracking-[.14em]" style={{ color: e.kind === "alert" ? "#dc2626" : acc }}>
                <time dateTime={e.at}>{time(e.at)}</time> · {e.label}
              </p>
              <a href={e.href} className="group mt-1.5 flex gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[20px] font-extrabold leading-snug group-hover:underline md:text-[23px]">{e.title}</h2>
                  {e.text && <p className="mt-1.5 text-[15.5px] leading-relaxed text-gray-700">{e.text}</p>}
                </div>
                {e.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image} alt="" loading={i < 3 ? "eager" : "lazy"} className="hidden h-24 w-36 shrink-0 object-cover sm:block" />
                )}
              </a>
            </li>
          ))}
          {entries.length === 0 && <li className="text-[17px]">No updates yet today. This page refreshes itself.</li>}
        </ol>
      </main>
      <LiveRefresh seconds={60} />
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
