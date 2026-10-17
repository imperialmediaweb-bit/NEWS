import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { getGscToken, listProperties, inspectUrl } from "@/lib/gsc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Ask Google, per URL, whether it is actually in the index — and if not, why.
 *
 *   GET /api/admin/index-check?key=CRON_SECRET&perSite=3
 *
 *   perSite   URLs to inspect per site (default 3, max 10)
 *   site      optional single site slug
 *
 * Impressions in the performance report tell you a site is being shown
 * somewhere; they do not tell you how much of it Google has actually kept.
 * The URL Inspection API answers that directly, and its `coverageState` is
 * where the useful distinctions live:
 *
 *   "Submitted and indexed"              in the index
 *   "Crawled - currently not indexed"    Google fetched it and chose not to
 *                                        keep it — a quality judgement
 *   "Discovered - currently not indexed" Google knows the URL and has not
 *                                        bothered to fetch it — a crawl
 *                                        budget/priority judgement
 *   "Duplicate, Google chose different canonical"
 *
 * This costs one API call per URL against a 2,000/day per-property quota, so
 * it samples rather than sweeping — a handful of recent articles per site is
 * enough to tell which of the above is happening.
 *
 * Manual penalties are NOT available through any API. If you need to rule one
 * out, that is Search Console → Security & Manual Actions, by hand, per
 * property.
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perSite = Math.min(10, Math.max(1, parseInt(req.nextUrl.searchParams.get("perSite") || "3", 10) || 3));
  const onlySlug = req.nextUrl.searchParams.get("site");

  let token: string;
  let properties: Map<string, { siteUrl: string; permissionLevel: string }[]>;
  try {
    token = await getGscToken();
    properties = await listProperties(token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }

  const targets = (onlySlug
    ? Object.values(sites).filter((s) => s.slug === onlySlug)
    : Object.values(sites)
  ).filter((s) => properties.has(s.domain.toLowerCase()));

  if (targets.length === 0) {
    return NextResponse.json(
      { error: "No verified properties to inspect yet — let the gsc_setup job finish" },
      { status: 400 }
    );
  }

  const bySite: Record<string, unknown>[] = [];
  const coverageTotals: Record<string, number> = {};

  for (const site of targets) {
    const props = properties.get(site.domain.toLowerCase()) || [];
    // Prefer the domain property: it covers every host variant.
    const property =
      props.find((p) => p.siteUrl.startsWith("sc-domain:"))?.siteUrl || props[0]?.siteUrl;
    if (!property) continue;

    const { rows } = await pool.query(
      `SELECT a.category, a.slug
         FROM articles a
         JOIN sites s ON a.site_id = s.id
        WHERE s.slug = $1
        ORDER BY a.published_at DESC
        LIMIT $2`,
      [site.slug, perSite]
    );

    const urls = rows.map(
      (r: { category: string | null; slug: string }) =>
        `https://${site.domain}/${r.category || "local-news"}/${r.slug}`
    );

    const checked: Record<string, unknown>[] = [];
    for (const url of urls) {
      const result = await inspectUrl(token, property, url);
      const coverage = typeof result.coverageState === "string" ? result.coverageState : null;
      if (coverage) {
        coverageTotals[coverage] = (coverageTotals[coverage] || 0) + 1;
      }
      checked.push({ url, ...result });
    }

    bySite.push({
      site: site.slug,
      property,
      indexed: checked.filter((c) => c.verdict === "PASS").length,
      checked: checked.length,
      urls: checked,
    });
  }

  const totalChecked = bySite.reduce((n, s) => n + (s.checked as number), 0);
  const totalIndexed = bySite.reduce((n, s) => n + (s.indexed as number), 0);

  return NextResponse.json({
    propertiesInspected: bySite.length,
    urlsChecked: totalChecked,
    indexed: totalIndexed,
    notIndexed: totalChecked - totalIndexed,
    // The histogram is the part worth reading: it says whether Google is
    // declining to keep the pages or has not got round to fetching them.
    coverageStates: coverageTotals,
    note: "Manual penalties are not exposed by any API — check Search Console → Security & Manual Actions by hand.",
    bySite,
  });
}

