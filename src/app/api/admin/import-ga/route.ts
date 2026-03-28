import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";

const WP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Referer": "https://www.google.com/",
};

function extractGaId(html: string): string | null {
  // Match G-XXXXXXXXXX (GA4)
  const ga4Match = html.match(/G-[A-Z0-9]{6,12}/);
  if (ga4Match) return ga4Match[0];

  // Match UA-XXXXXXXX-X (Universal Analytics)
  const uaMatch = html.match(/UA-\d{6,10}-\d{1,3}/);
  if (uaMatch) return uaMatch[0];

  // Match GTM-XXXXXXX (Google Tag Manager)
  const gtmMatch = html.match(/GTM-[A-Z0-9]{6,10}/);
  if (gtmMatch) return gtmMatch[0];

  return null;
}

// Import GA for a single site
async function importGaForSite(siteSlug: string): Promise<{ gaId: string | null; error?: string }> {
  const siteConfig = sites[siteSlug];
  if (!siteConfig) return { gaId: null, error: "Site not found" };

  const urls = [
    `https://www.${siteConfig.domain}`,
    `https://${siteConfig.domain}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: WP_HEADERS,
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });
      if (!res.ok) continue;

      const html = await res.text();
      const gaId = extractGaId(html);

      if (gaId) {
        // Save to DB
        await pool.query(
          "UPDATE sites SET ga_measurement_id = $1 WHERE slug = $2",
          [gaId, siteSlug]
        );
        return { gaId };
      }
    } catch {
      continue;
    }
  }

  return { gaId: null, error: "Could not find GA code" };
}

// POST: import GA for one site
export async function POST(request: NextRequest) {
  try {
    const { siteSlug } = await request.json();
    const result = await importGaForSite(siteSlug);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET: import GA for ALL sites
export async function GET() {
  const results: Record<string, { gaId: string | null; error?: string }> = {};
  const siteList = Object.values(sites);

  // Process 5 at a time
  for (let i = 0; i < siteList.length; i += 5) {
    const batch = siteList.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((s) => importGaForSite(s.slug).then((r) => ({ slug: s.slug, ...r })))
    );
    for (const r of batchResults) {
      results[r.slug] = { gaId: r.gaId, error: r.error };
    }
  }

  const found = Object.values(results).filter((r) => r.gaId).length;
  return NextResponse.json({
    total: siteList.length,
    found,
    notFound: siteList.length - found,
    results,
  });
}
