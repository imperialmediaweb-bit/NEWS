import { NextResponse } from "next/server";
import { seoPages } from "@/data/seo-pages";

export async function GET() {
  const urls: string[] = [];

  for (const state of seoPages) {
    for (const page of state.pages) {
      urls.push(
        `  <url>
    <loc>https://${state.domain}/seo/${state.stateSlug}/${page.topicSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, max-age=86400",
    },
  });
}
