import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";

// Known categories — single-segment paths matching these are category pages
const KNOWN_CATEGORIES = new Set([
  "local-news", "us-news", "world-news", "politics", "sports",
  "entertainment", "business", "technology", "opinion", "celebrity",
  "scandals", "crime", "health", "education", "weather", "lifestyle",
  "admin", "tag",
]);

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0];
  const pathname = request.nextUrl.pathname;

  // Skip static and system routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/tag")
  ) {
    const site = getSiteByDomain(domain);
    if (site) {
      const response = NextResponse.next();
      response.headers.set("x-site-slug", site.slug);
      return response;
    }
    return NextResponse.next();
  }

  // Find site by domain
  const site = getSiteByDomain(domain);

  // Handle WordPress-style URLs: /article-slug (single segment, not a known category)
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 1) {
    const segment = segments[0];
    if (!KNOWN_CATEGORIES.has(segment)) {
      // This is likely a WordPress article URL — rewrite to /wp-article/[slug]
      const url = request.nextUrl.clone();
      url.pathname = `/wp-article/${segment}`;
      const response = NextResponse.rewrite(url);
      if (site) response.headers.set("x-site-slug", site.slug);
      return response;
    }
  }

  // Handle WordPress date-based URLs: /YYYY/MM/DD/slug or /YYYY/MM/slug
  if (segments.length >= 3 && /^\d{4}$/.test(segments[0]) && /^\d{2}$/.test(segments[1])) {
    const articleSlug = segments[segments.length - 1];
    const url = request.nextUrl.clone();
    url.pathname = `/wp-article/${articleSlug}`;
    const response = NextResponse.rewrite(url);
    if (site) response.headers.set("x-site-slug", site.slug);
    return response;
  }

  if (site) {
    const response = NextResponse.next();
    response.headers.set("x-site-slug", site.slug);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
