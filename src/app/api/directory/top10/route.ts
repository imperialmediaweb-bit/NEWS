import { NextRequest } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, rank } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { mockupOf } from "@/config/design-cfg";

/** "#3 Best Auto Repair in Houston · Nov 2026" badge (SVG), only while the business is in its town's top 10. */
export const dynamic = "force-dynamic";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const b = site ? await getBusiness(site.slug, req.nextUrl.searchParams.get("b") || "") : null;
  if (!site || !b) return new Response("Not found", { status: 404 });
  const list = await rank(site.slug, b.city_slug, b.category);
  const pos = list.findIndex((r) => r.name.toLowerCase() === b.name.toLowerCase());
  if (pos < 0 || list.length < 5) return new Response("Not in the top 10", { status: 404 });
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || "#b91c1c";
  const month = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const cat = catBySlug(b.category)?.name || "Businesses";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="Top 10 ${x(cat)} in ${x(b.city)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset="1" stop-color="#b8862b"/></linearGradient></defs>
<circle cx="120" cy="120" r="116" fill="url(#g)"/><circle cx="120" cy="120" r="102" fill="${ink}"/><circle cx="120" cy="120" r="96" fill="none" stroke="#f6d27a" stroke-width="1.5" stroke-dasharray="3 4"/>
<text x="120" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#f6d27a" letter-spacing="2">${x(site.name.toUpperCase())}</text>
<text x="120" y="118" text-anchor="middle" font-family="Georgia,serif" font-size="52" font-weight="700" fill="#ffffff">#${pos + 1}</text>
<text x="120" y="145" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="800" fill="#ffffff">BEST ${x(cat.toUpperCase().slice(0, 22))}</text>
<text x="120" y="164" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#ffffff" opacity=".85">in ${x(b.city.slice(0, 22))}</text>
<rect x="70" y="176" width="100" height="22" rx="11" fill="${acc}"/><text x="120" y="191" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#ffffff">${x(month.toUpperCase())}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
