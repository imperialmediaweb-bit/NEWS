import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/facebook";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const adminCookie = req.cookies.get("admin_token")?.value;
  const adminSecret = process.env.CRON_SECRET || "admin123";
  return adminCookie === adminSecret;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureSchema();
  const { rows } = await query(
    `SELECT id, page_id, page_name, site_slug, category, connected_at, updated_at
     FROM facebook_pages ORDER BY page_name ASC`
  );
  return NextResponse.json({ pages: rows });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { page_id, site_slug } = await req.json();
  if (!page_id) return NextResponse.json({ error: "page_id required" }, { status: 400 });
  await query(
    `UPDATE facebook_pages SET site_slug = $1, updated_at = NOW() WHERE page_id = $2`,
    [site_slug || null, page_id]
  );
  return NextResponse.json({ ok: true });
}
