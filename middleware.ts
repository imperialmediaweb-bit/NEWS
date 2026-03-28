import { NextRequest, NextResponse } from "next/server";
import { sites, getSiteByDomain } from "@/config/sites";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  // Strip port for local dev
  const domain = hostname.split(":")[0];

  // Skip admin, api, and static routes
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Find site by domain
  const site = getSiteByDomain(domain);

  if (site) {
    // Set site slug in header for server components to read
    const response = NextResponse.next();
    response.headers.set("x-site-slug", site.slug);
    return response;
  }

  // For localhost / development, use ACTIVE_SITE from config
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
