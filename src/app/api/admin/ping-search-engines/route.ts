import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSiteByDomain } from "@/config/sites";

export async function GET() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const siteConfig = getSiteByDomain(host);
    const domain = siteConfig?.domain || host.replace(/:\d+$/, "");

    const sitemapUrl = `https://${domain}/sitemap.xml`;

    const results: Record<string, string> = {};

    // Ping Google
    try {
      await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      results.google = "pinged";
    } catch {
      results.google = "failed";
    }

    // Ping Bing via IndexNow sitemap ping
    try {
      await fetch(
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      results.bing = "pinged";
    } catch {
      results.bing = "failed";
    }

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
