import type { Metadata } from "next";
import { siteFromHeaders } from "@/lib/topic-page";
import { ownerBusinesses } from "@/lib/directory-owner";
import { ownerPosition } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { bizSiteFor, isLive } from "@/lib/business-site";
import { mockupOf } from "@/config/design-cfg";
import PrintButton from "@/components/directory/PrintButton";

/** Monthly printable certificate: the business's place and Express Score this month (website subscribers). */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

export default async function Certificate({ searchParams }: { searchParams: { t?: string; b?: string } }) {
  const site = siteFromHeaders();
  const own = searchParams.t ? await ownerBusinesses(searchParams.t, site.slug).catch(() => null) : null;
  const b = own?.businesses.find((x: { id: number }) => x.id === Number(searchParams.b)) as Record<string, string | number> | undefined;
  const msg = (t: string) => <main style={{ fontFamily: "system-ui", maxWidth: 520, margin: "80px auto", padding: 16, fontSize: 17 }}>{t}</main>;
  if (!b) return msg("This link has expired. Open your dashboard again from the latest email.");
  const bsite = await bizSiteFor(Number(b.id)).catch(() => null);
  if (!bsite || !isLive(bsite)) return msg("The monthly certificate is included with your business website. Publish it from your dashboard (from $9 the first month).");
  const st = await ownerPosition(site.slug, String(b.city_slug), String(b.category), Number(b.id));
  if (!st) return msg("We couldn't work out your ranking right now. Please try again later.");
  const cat = catBySlug(String(b.category));
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const title = st.position <= 3 ? `Top ${st.position === 1 ? "1" : "3"} ${cat?.name || "Businesses"}` : st.position <= 10 ? `Top 10 ${cat?.name || "Businesses"}` : `Ranked ${cat?.name || "Business"}`;
  return (
    <main style={{ background: "#f3f1ec", minHeight: "100vh", padding: "24px 12px", fontFamily: "Georgia, serif" }}>
      <style>{`@page{size:landscape;margin:0}@media print{.noprint{display:none}main{background:#fff!important;padding:0!important}}`}</style>
      <div className="noprint" style={{ maxWidth: 960, margin: "0 auto 12px", textAlign: "right" }}><PrintButton /></div>
      <div style={{ maxWidth: 960, margin: "0 auto", background: "#fff", border: `14px double ${ink}`, padding: "48px 56px", textAlign: "center", color: ink }}>
        <p style={{ letterSpacing: ".3em", fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: acc }}>{site.name} · Business Guide</p>
        <h1 style={{ fontSize: 46, margin: "18px 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 20, margin: 0 }}>in {String(b.city)}, {site.state} · {month}</p>
        <p style={{ fontSize: 15, margin: "30px 0 4px", fontFamily: "system-ui", color: "#555" }}>This certifies that</p>
        <h2 style={{ fontSize: 40, margin: "4px 0 10px" }}>{String(b.name)}</h2>
        <p style={{ fontSize: 19, margin: 0 }}>ranked <b>#{st.position}</b> of {st.total} {cat?.name.toLowerCase() || "businesses"} in {String(b.city)} with an <b>Express Score of {st.score.total}/100</b>,</p>
        <p style={{ fontSize: 16, margin: "6px 0 0", color: "#555" }}>based on verified reader reviews, a complete profile and a confirmed owner.</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 46, fontFamily: "system-ui", fontSize: 13, color: "#555" }}>
          <span style={{ borderTop: `2px solid ${ink}`, paddingTop: 6, minWidth: 220 }}>{site.name} Directory</span>
          <span style={{ fontSize: 44 }} aria-hidden>🏅</span>
          <span style={{ borderTop: `2px solid ${ink}`, paddingTop: 6, minWidth: 220 }}>{site.domain}/directory</span>
        </div>
      </div>
    </main>
  );
}
