import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { optoutSig } from "@/lib/owner-drip";

/** One-click unsubscribe from the owner follow-up emails (signed link). */
export const dynamic = "force-dynamic";

async function optout(req: NextRequest) {
  const b = Number(req.nextUrl.searchParams.get("b")), s = req.nextUrl.searchParams.get("s") || "";
  const want = b ? optoutSig(b) : "";
  if (!b || s.length !== want.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want))) return false;
  await pool.query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_optout BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => null);
  await pool.query(`UPDATE businesses SET marketing_optout = TRUE WHERE id = $1`, [b]);
  return true;
}

export async function GET(req: NextRequest) {
  const ok = await optout(req);
  return new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 16px;font-size:17px">${ok ? "You're unsubscribed. You won't get these emails again. Your listing stays as it is." : "This link is not valid."}</body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// mail apps' one-click unsubscribe (List-Unsubscribe) posts to the same link
export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: await optout(req) });
}
