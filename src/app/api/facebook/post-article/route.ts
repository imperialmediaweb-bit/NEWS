import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema, postArticleToFacebookPage, ArticleForFb } from "@/lib/facebook";
import { sites } from "@/config/sites";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function checkAuth(req: NextRequest): boolean {
  const adminCookie = req.cookies.get("admin_token")?.value;
  const adminSecret = process.env.CRON_SECRET || "admin123";
  if (adminCookie === adminSecret) return true;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  return false;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const { page_id, article_id } = body as { page_id?: string; article_id?: number };
  if (!page_id) return NextResponse.json({ error: "page_id required" }, { status: 400 });

  const pageRes = await query(
    `SELECT page_id, page_name, site_slug, access_token FROM facebook_pages WHERE page_id = $1 LIMIT 1`,
    [page_id]
  );
  const page = pageRes.rows[0];
  if (!page) return NextResponse.json({ error: "page not connected" }, { status: 404 });
  if (!page.site_slug) return NextResponse.json({ error: "page has no site_slug — set it in admin first" }, { status: 400 });

  let article: ArticleForFb | undefined;
  if (article_id) {
    const r = await query(
      `SELECT a.id, a.title, a.summary AS excerpt, a.featured_image, a.slug, a.category AS category_slug, s.slug AS site_slug
       FROM articles a JOIN sites s ON a.site_id = s.id
       WHERE a.id = $1`,
      [article_id]
    );
    article = r.rows[0];
  } else {
    const r = await query(
      `SELECT a.id, a.title, a.summary AS excerpt, a.featured_image, a.slug, a.category AS category_slug, s.slug AS site_slug
       FROM articles a JOIN sites s ON a.site_id = s.id
       WHERE s.slug = $1
       ORDER BY a.published_at DESC NULLS LAST, a.id DESC
       LIMIT 1`,
      [page.site_slug]
    );
    article = r.rows[0];
  }
  if (!article) return NextResponse.json({ error: "no article found" }, { status: 404 });

  const siteCfg = sites[page.site_slug];
  const siteDomain = siteCfg?.domain || `${page.site_slug}.com`;

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
      [article.id, page.site_slug, page.page_id, r.post_id]
    );
    return NextResponse.json({ ok: true, post_id: r.post_id, comment_id: r.comment_id, comment_error: r.comment_error, link: r.link, article: { id: article.id, title: article.title } });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await query(
      `INSERT INTO facebook_posts (article_id, site_slug, page_id, status, error)
       VALUES ($1, $2, $3, 'error', $4)`,
      [article.id, page.site_slug, page.page_id, errMsg]
    );
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }
}
