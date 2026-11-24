import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness } from "@/lib/directory";
import { mockupOf } from "@/config/design-cfg";

/**
 * Printable "Review us" QR code for a business: SVG, links to its review form.
 * ?format=sign returns a ready-to-print counter sign (SVG, letter size).
 */
export const dynamic = "force-dynamic";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const b = site ? await getBusiness(site.slug, req.nextUrl.searchParams.get("b") || "") : null;
  if (!site || !b) return new Response("Not found", { status: 404 });
  const url = `https://${site.domain}/directory/listing/${b.slug}?utm_source=qr#review`;
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d", acc = m?.acc || site.accent || "#b91c1c";
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: ink, light: "#ffffff" }, errorCorrectionLevel: "M" });
  if (req.nextUrl.searchParams.get("format") !== "sign") return new Response(qr, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
  const inner = qr.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vb = (qr.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 33 33";
  const sign = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100">
<rect width="850" height="1100" fill="#ffffff"/><rect width="850" height="150" fill="${ink}"/><rect y="150" width="850" height="10" fill="${acc}"/>
<text x="425" y="95" text-anchor="middle" font-family="Georgia,serif" font-size="54" font-weight="700" fill="#ffffff">${x(site.name)}</text>
<text x="425" y="250" text-anchor="middle" font-family="Arial,sans-serif" font-size="52" font-weight="800" fill="${ink}">Enjoyed your visit?</text>
<text x="425" y="320" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#333">Review ${x(b.name.slice(0, 34))}</text>
<svg x="225" y="370" width="400" height="400" viewBox="${vb}">${inner}</svg>
<text x="425" y="830" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${acc}">Scan with your phone camera</text>
<text x="425" y="880" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#555">It takes one minute. Honest reviews help ${x(b.city)} neighbors.</text>
<text x="425" y="1050" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#888">${x(site.domain)}</text></svg>`;
  return new Response(sign, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": `inline; filename="review-${b.slug}.svg"`, "Cache-Control": "public, max-age=86400" } });
}
