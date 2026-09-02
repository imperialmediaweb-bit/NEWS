import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";

export async function GET(request: NextRequest) {
  const siteSlug = request.nextUrl.searchParams.get("site") || "";
  const site = sites[siteSlug];
  const abbr = site?.stateAbbr || "US";
  // A standalone SVG has no access to the page's CSS variables, so the
  // state colour must be baked in here.
  const accent = site?.accent || "#C1121F";

  // Generate SVG favicon with state abbreviation, in that state's colour
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="${accent}"/>
    <text x="16" y="22" font-family="Arial,sans-serif" font-size="${abbr.length > 2 ? 10 : 13}" font-weight="bold" fill="white" text-anchor="middle">${abbr}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
