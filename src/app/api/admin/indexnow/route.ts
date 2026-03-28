import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { submitToIndexNow } from "@/lib/indexnow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, siteSlug, hours } = body as {
      urls?: string[];
      siteSlug?: string;
      hours?: number;
    };

    // Mode 1: Direct URL list
    if (urls && Array.isArray(urls) && urls.length > 0) {
      // Extract domain from the first URL
      const urlObj = new URL(urls[0]);
      const domain = urlObj.hostname.replace(/^www\./, "");
      const success = await submitToIndexNow(domain, urls);

      return NextResponse.json({ submitted: urls.length, success });
    }

    // Mode 2: Site slug + hours — query DB for recent articles
    if (siteSlug && hours) {
      const siteConfig = sites[siteSlug];
      if (!siteConfig) {
        return NextResponse.json(
          { error: "Site not found" },
          { status: 400 }
        );
      }

      const { rows: siteRows } = await pool.query(
        "SELECT id FROM sites WHERE slug = $1",
        [siteSlug]
      );

      if (siteRows.length === 0) {
        return NextResponse.json(
          { error: "Site not found in database" },
          { status: 404 }
        );
      }

      const siteId = siteRows[0].id;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { rows: articles } = await pool.query(
        "SELECT slug FROM articles WHERE site_id = $1 AND published_at >= $2",
        [siteId, cutoff.toISOString()]
      );

      if (articles.length === 0) {
        return NextResponse.json({ submitted: 0, success: true });
      }

      const articleUrls = articles.map(
        (a: Record<string, unknown>) =>
          `https://${siteConfig.domain}/${a.slug}`
      );

      const success = await submitToIndexNow(siteConfig.domain, articleUrls);

      return NextResponse.json({
        submitted: articleUrls.length,
        success,
      });
    }

    return NextResponse.json(
      { error: "Provide either { urls } or { siteSlug, hours }" },
      { status: 400 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
