import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Emoji reactions (Express Swipe, same as the Expres network). Real counts:
 * one reaction per person per story (the IP is kept only as a hash), counted
 * on the server. GET ?ids=1,2,3 → counts; POST {id, e}.
 */
const EMOJI = ["❤️", "😮", "😢", "😡", "👍"] as const;
let ready = false;
async function schema() {
  if (ready) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS reactions (article_id INTEGER NOT NULL, emoji TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (article_id, ip_hash))`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reactions_article ON reactions(article_id)`);
  ready = true;
}

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x > 0).slice(0, 80);
  if (!ids.length) return NextResponse.json({ reactions: {} });
  await schema();
  const r = await pool.query(`SELECT article_id, emoji, COUNT(*)::int AS n FROM reactions WHERE article_id = ANY($1::int[]) GROUP BY article_id, emoji`, [ids]).catch(() => ({ rows: [] as Array<{ article_id: number; emoji: string; n: number }> }));
  const out: Record<number, Record<string, number>> = {};
  for (const x of r.rows) (out[x.article_id] ||= {})[x.emoji] = x.n;
  return NextResponse.json({ reactions: out });
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { id?: number; e?: string };
  const id = parseInt(String(b.id), 10);
  const e = String(b.e || "");
  if (!Number.isFinite(id) || !(EMOJI as readonly string[]).includes(e)) return NextResponse.json({ error: "bad input" }, { status: 400 });
  await schema();
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const h = createHash("sha256").update(`reactions:${ip}:${req.headers.get("user-agent") || ""}`).digest("hex").slice(0, 32);
  // one reaction per person per story; a new choice replaces the old one
  await pool.query(`INSERT INTO reactions (article_id, emoji, ip_hash) VALUES ($1, $2, $3) ON CONFLICT (article_id, ip_hash) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = NOW()`, [id, e, h]).catch(() => null);
  const r = await pool.query(`SELECT emoji, COUNT(*)::int AS n FROM reactions WHERE article_id = $1 GROUP BY emoji`, [id]).catch(() => ({ rows: [] as Array<{ emoji: string; n: number }> }));
  const n: Record<string, number> = {};
  for (const x of r.rows) n[x.emoji] = x.n;
  return NextResponse.json({ reactions: n });
}
