import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureNewsletterTable } from "@/lib/newsletter";

/** GET /api/newsletter/confirm?t=TOKEN — confirms the subscription, then shows the homepage. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") || "";
  await ensureNewsletterTable();
  if (/^[a-f0-9]{36}$/.test(t)) {
    await pool.query("UPDATE newsletter_subscribers SET status = 'confirmed', confirmed_at = now() WHERE token = $1 AND status <> 'unsubscribed'", [t]);
  }
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Subscribed</title><body style="font-family:system-ui;max-width:520px;margin:60px auto;padding:0 16px"><h1>You're subscribed</h1><p>The morning newsletter will arrive once a day. You can unsubscribe from any email with one click.</p><p><a href="/">Back to the news</a></p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
