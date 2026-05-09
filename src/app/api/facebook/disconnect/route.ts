import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("admin_token")?.value;
  const adminSecret = process.env.CRON_SECRET || "admin123";
  if (adminCookie !== adminSecret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { page_id } = await req.json();
  if (page_id) {
    await query(`DELETE FROM facebook_pages WHERE page_id = $1`, [page_id]);
  } else {
    await query(`DELETE FROM facebook_pages`);
  }
  return NextResponse.json({ ok: true });
}
