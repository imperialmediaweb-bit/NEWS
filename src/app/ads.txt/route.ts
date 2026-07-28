import { NextResponse } from "next/server";

/**
 * ads.txt — required by Google AdSense on every domain.
 * Served identically across all 50 sites (same publisher ID).
 */
export async function GET() {
  const body = "google.com, pub-3341252465268510, DIRECT, f08c47fec0942fa0\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
