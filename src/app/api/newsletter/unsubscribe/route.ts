import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureNewsletterTable } from "@/lib/newsletter";

/** GET or POST /api/newsletter/unsubscribe?t=TOKEN — one click, no login (RFC 8058 for POST). */
export const dynamic = "force-dynamic";

async function unsubscribe(t: string) {
  await ensureNewsletterTable();
  if (/^[a-f0-9]{36}$/.test(t)) await pool.query("UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE token = $1", [t]);
}

export async function POST(req: NextRequest) {
  await unsubscribe(req.nextUrl.searchParams.get("t") || "");
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  await unsubscribe(req.nextUrl.searchParams.get("t") || "");
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribed</title><body style="font-family:system-ui;max-width:520px;margin:60px auto;padding:0 16px"><h1>You're unsubscribed</h1><p>You will not receive the newsletter any more.</p><p><a href="/">Back to the news</a></p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
