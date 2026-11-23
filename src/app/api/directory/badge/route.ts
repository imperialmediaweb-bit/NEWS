import { NextRequest } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, isSpotlight, ratingOf } from "@/lib/directory";
import { mockupOf } from "@/config/design-cfg";

/** "Featured on {Paper}" badge (SVG) for a Spotlight business's own website. */
export const dynamic = "force-dynamic";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const b = site ? await getBusiness(site.slug, req.nextUrl.searchParams.get("b") || "") : null;
  const m = site ? mockupOf(site.slug) : null;
  const ink = m?.ink || "#14213d", acc = m?.acc || "#b91c1c";
  const ok = b && isSpotlight(b);
  const r = b ? ratingOf(b) : null;
  const line2 = ok ? (r ? `★ ${r.toFixed(1)} from ${b!.rating_count} reader review${b!.rating_count === 1 ? "" : "s"}` : `${site!.state} business directory`) : "Local business directory";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="64" viewBox="0 0 200 64" role="img" aria-label="Featured on ${x(site?.name || "Express")}">
<rect width="200" height="64" rx="6" fill="${ink}"/><rect x="0" y="0" width="6" height="64" rx="3" fill="${acc}"/>
<text x="16" y="20" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700" fill="#ffffff" opacity=".75" letter-spacing="1.5">FEATURED ON</text>
<text x="16" y="38" font-family="Georgia,serif" font-size="16" font-weight="700" fill="#ffffff">${x(site?.name || "Express")}</text>
<text x="16" y="54" font-family="Arial,Helvetica,sans-serif" font-size="10" fill="#ffffff" opacity=".85">${x(line2)}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
