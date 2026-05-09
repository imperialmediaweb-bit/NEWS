import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, postToPage } from "@/lib/facebook";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  const body = await req.json();
  const { page_id, site_slug, message, link, article_id } = body as {
    page_id?: string;
    site_slug?: string;
    message: string;
    link?: string;
    article_id?: number;
  };

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  if (!page_id && !site_slug) return NextResponse.json({ error: "page_id or site_slug required" }, { status: 400 });

  await ensureSchema();

  const where = page_id ? "page_id = $1" : "site_slug = $1";
  const param = page_id || site_slug;
  const { rows } = await query(
    `SELECT page_id, page_name, site_slug, access_token FROM facebook_pages WHERE ${where} LIMIT 1`,
    [param]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "page not found" }, { status: 404 });
  }
  const page = rows[0];

  try {
    const result = await postToPage(page.page_id, page.access_token, message, link);
    await query(
      `INSERT INTO facebook_posts (article_id, site_slug, page_id, fb_post_id, status)
       VALUES ($1, $2, $3, $4, 'success')`,
      [article_id || null, page.site_slug || "", page.page_id, result.id]
    );
    return NextResponse.json({ ok: true, fb_post_id: result.id });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await query(
      `INSERT INTO facebook_posts (article_id, site_slug, page_id, status, error)
       VALUES ($1, $2, $3, 'error', $4)`,
      [article_id || null, page.site_slug || "", page.page_id, errMsg]
    );
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
