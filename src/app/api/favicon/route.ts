import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";

export async function GET(request: NextRequest) {
  const siteSlug = request.nextUrl.searchParams.get("site") || "";
  const site = sites[siteSlug];
  const abbr = site?.stateAbbr || "US";

  // Generate SVG favicon with state abbreviation
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#c1121f"/>
    <text x="16" y="22" font-family="Arial,sans-serif" font-size="${abbr.length > 2 ? 10 : 13}" font-weight="bold" fill="white" text-anchor="middle">${abbr}</text>
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
