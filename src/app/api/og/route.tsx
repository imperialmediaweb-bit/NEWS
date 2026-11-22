import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { mockupOf } from "@/config/design-cfg";

/** The share card (1200x630) for a site's homepage and sections, in its mockup's colours. */
export async function GET(req: NextRequest) {
  const domain = (req.headers.get("host") || "").split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const m = mockupOf(site.slug);
  const ink = m?.ink || "#14213d";
  const acc = m?.acc || site.accent;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: `linear-gradient(135deg, ${ink}, #000)`, color: "#fff" }}>
        <div style={{ display: "flex", width: 120, height: 10, background: acc, marginBottom: 36 }} />
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>{site.name}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 20, opacity: 0.9 }}>{m?.slogan || site.tagline}</div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 48, color: acc }}>{`${site.state} news · weather · politics · sports`}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } }
  );
}
