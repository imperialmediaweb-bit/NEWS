import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getActiveSite, getSiteByDomain } from "@/config/sites";
import { mockupOf } from "@/config/design-cfg";

/** The app icon (512x512) of each site: its state's letters on its mockup colours. */
export async function GET(req: NextRequest) {
  const domain = (req.headers.get("host") || "").split(":")[0].replace("www.", "");
  const site = getSiteByDomain(domain) || getActiveSite();
  const m = mockupOf(site.slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: m?.ink || "#14213d", color: "#fff", fontSize: 512 * 0.42, fontWeight: 800, letterSpacing: -2, borderBottom: `${Math.round(512 * 0.08)}px solid ${m?.acc || site.accent}` }}>
        {site.stateAbbr}
      </div>
    ),
    { width: 512, height: 512, headers: { "Cache-Control": "public, max-age=604800, s-maxage=2592000" } }
  );
}
