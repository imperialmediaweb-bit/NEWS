import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { getAllStateAlerts } from "@/lib/local-data";
import { ensureSubmissionsTable } from "@/lib/submissions";
import { TZ } from "@/config/timezones";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateContent } from "@/data/generate-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} Weather Alerts, Closings and Delays Today`,
    description: `Active National Weather Service warnings and watches for ${site.state}, and school, office and business closings and delays reported to ${site.name}. Updated continuously.`,
    alternates: { canonical: `https://${site.domain}/alerts` },
  };
}

const COLOR: Record<string, string> = { Extreme: "#7f1d1d", Severe: "#b91c1c", Moderate: "#c2410c", Minor: "#a16207", Unknown: "#4b5563" };

export default async function AlertsPage() {
  const site = siteFromHeaders();
  const tz = TZ[site.state] || "America/New_York";
  const fmt = (d: string) => (d ? new Date(d).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: tz, timeZoneName: "short" }) : "");
  const alerts = (await getAllStateAlerts(site.stateAbbr).catch(() => null)) || [];
  await ensureSubmissionsTable();
  const { rows: closings } = await pool.query(
    `SELECT title, city, event_date, reviewed_at FROM submissions
      WHERE site_slug = $1 AND type = 'closing' AND status = 'approved' AND reviewed_at > now() - interval '36 hours'
      ORDER BY reviewed_at DESC LIMIT 100`,
    [site.slug]
  );
  return (
    <>
      <Header site={site} />
      <main className="mx-auto max-w-[960px] px-4 py-10">
        <h1 className="text-[32px] font-extrabold leading-tight md:text-[42px]">{site.state} alerts, closings and delays</h1>
        <p className="mt-2 text-[16px] text-gray-600">
          Updated {fmt(new Date().toISOString())}. Weather alerts come from the National Weather Service; closings are reported to our newsroom and checked before they appear.
        </p>

        <section className="mt-8">
          <h2 className="text-[22px] font-extrabold">Weather alerts ({alerts.length})</h2>
          {alerts.length === 0 && <p className="mt-3 text-gray-600">No active weather alerts for {site.state} right now.</p>}
          <div className="mt-3 space-y-3">
            {alerts.map((a) => (
              <article key={a.id} className="rounded border-l-4 bg-white p-4 shadow-sm" style={{ borderColor: COLOR[a.severity] || COLOR.Unknown }}>
                <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: COLOR[a.severity] || COLOR.Unknown }}>{a.severity} · {a.event}</p>
                <h3 className="mt-1 text-[17px] font-bold leading-snug">{a.headline}</h3>
                <p className="mt-1 text-[14px] text-gray-700"><b>Where:</b> {a.area}</p>
                <p className="text-[13px] text-gray-600">{a.effective && <>From {fmt(a.effective)}</>}{a.expires && <> · until {fmt(a.expires)}</>}</p>
                {a.instruction && <p className="mt-2 text-[14px]">{a.instruction}</p>}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[22px] font-extrabold">Closings and delays ({closings.length})</h2>
          {closings.length === 0 && <p className="mt-3 text-gray-600">No closings reported in the last 36 hours.</p>}
          <ul className="mt-3 divide-y rounded bg-white shadow-sm">
            {closings.map((c, i) => (
              <li key={i} className="p-3 text-[15px]">
                <b>{c.title}</b>{c.city ? <> — {c.city}</> : null}{c.event_date ? <span className="text-gray-600"> · {c.event_date}</span> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px]">
            School, office, church or business closed or delayed? <a href="/submit" className="font-bold underline">Report a closing</a> and we will add it after checking.
          </p>
        </section>
      </main>
      <Footer site={site} about={generateContent(site).footerAbout} />
    </>
  );
}
