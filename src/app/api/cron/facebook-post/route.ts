import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema, postArticleToFacebookPage, ArticleForFb } from "@/lib/facebook";
import { sites } from "@/config/sites";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PageRow {
  page_id: string;
  page_name: string;
  site_slug: string;
  access_token: string;
}

// Words that trigger Facebook content moderation — skip these articles
const SENSITIVE_KEYWORDS = [
  "killed", "murder", "rape", "sexual assault", "suicide", "dead body",
  "mass shooting", "school shooting", "child abuse", "child exploitation",
  "domestic violence", "homicide", "manslaughter", "fatal", "death toll",
  "massacre", "terrorist", "terrorism", "bomb threat", "hostage",
  "overdose", "drug bust", "human trafficking", "kidnapping",
  "molestation", "pedophile", "arson death", "hate crime",
];

function isSensitiveContent(title: string, excerpt: string | null): boolean {
  const text = `${title} ${excerpt || ""}`.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => text.includes(kw));
}

async function postOneArticleForSite(siteSlug: string, maxPerHour: number): Promise<{ ok: boolean; reason: string; details?: unknown }> {
  const pageRes = await query(
    `SELECT page_id, page_name, site_slug, access_token
     FROM facebook_pages
     WHERE site_slug = $1
     LIMIT 1`,
    [siteSlug]
  );
  const page = pageRes.rows[0] as PageRow | undefined;
  if (!page) return { ok: false, reason: "no_fb_page_for_site" };

  // Check hourly quota (1 post per hour per page)
  const quotaRes = await query(
    `SELECT COUNT(*)::int AS cnt FROM facebook_posts
     WHERE page_id = $1 AND status = 'success' AND posted_at >= NOW() - INTERVAL '1 hour'`,
    [page.page_id]
  );
  if ((quotaRes.rows[0]?.cnt || 0) >= maxPerHour) {
    return { ok: false, reason: "hourly_quota_reached" };
  }

  // SUA adaptation: JOIN sites to get site_slug, map summary→excerpt, category→category_slug
  const articleRes = await query(
    `SELECT a.id, a.title, a.summary AS excerpt, a.featured_image, a.slug, a.category AS category_slug, s.slug AS site_slug
     FROM articles a
     JOIN sites s ON a.site_id = s.id
     LEFT JOIN facebook_posts fp
       ON fp.article_id = a.id AND fp.page_id = $2 AND fp.status = 'success'
     WHERE s.slug = $1
       AND fp.id IS NULL
       AND a.published_at >= NOW() - INTERVAL '24 hours'
     ORDER BY a.published_at DESC NULLS LAST, a.id DESC
     LIMIT 1`,
    [siteSlug, page.page_id]
  );
  const article = articleRes.rows[0] as ArticleForFb | undefined;
  if (!article) return { ok: false, reason: "no_new_article" };

  // Skip sensitive content that could get the page flagged
  if (isSensitiveContent(article.title, article.excerpt)) {
    return { ok: false, reason: "sensitive_content_skipped", details: article.title };
  }

  const siteCfg = sites[siteSlug];
  const siteDomain = siteCfg?.domain || `${siteSlug}.com`;

  try {
    const r = await postArticleToFacebookPage({
      pageId: page.page_id,
      accessToken: page.access_token,
      article,
      siteDomain,
      siteCity: siteCfg?.city,
      siteState: siteCfg?.state,
    });
    await query(
      `INSERT INTO facebook_posts (article_id, site_slug, page_id, fb_post_id, status)
       VALUES ($1, $2, $3, $4, 'success')`,
      [article.id, siteSlug, page.page_id, r.post_id]
    );
    return { ok: true, reason: "posted", details: { post_id: r.post_id, comment_id: r.comment_id, article_id: article.id } };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await query(
      `INSERT INTO facebook_posts (article_id, site_slug, page_id, status, error)
       VALUES ($1, $2, $3, 'error', $4)`,
      [article.id, siteSlug, page.page_id, errMsg]
    );
    return { ok: false, reason: "post_failed", details: errMsg };
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.CRON_SECRET;
  if (secret && key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only post during US hours: 8 AM - 6 PM EST (UTC-5)
  const now = new Date();
  const estHour = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
  const forceAll = req.nextUrl.searchParams.get("all") === "1";
  if (!forceAll && (estHour < 8 || estHour >= 18)) {
    return NextResponse.json({ message: "Outside posting hours (8 AM - 6 PM EST)", estHour });
  }

  await ensureSchema();

  const siteParam = req.nextUrl.searchParams.get("site");
  const maxPerHour = parseInt(req.nextUrl.searchParams.get("max_per_hour") || "1", 10);

  let targetSites: string[];
  if (siteParam) {
    targetSites = [siteParam];
  } else {
    const r = await query(
      `SELECT DISTINCT site_slug FROM facebook_pages WHERE site_slug IS NOT NULL AND site_slug <> ''`
    );
    targetSites = r.rows.map((row: { site_slug: string }) => row.site_slug);
  }

  const results: Record<string, { ok: boolean; reason: string; details?: unknown }> = {};
  for (const slug of targetSites) {
    results[slug] = await postOneArticleForSite(slug, maxPerHour);
  }

  const summary = {
    total: targetSites.length,
    posted: Object.values(results).filter((r) => r.ok).length,
    skipped: Object.values(results).filter((r) => !r.ok).length,
  };

  return NextResponse.json({ summary, results });
}
