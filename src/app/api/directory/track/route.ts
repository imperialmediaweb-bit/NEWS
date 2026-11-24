import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { dirSchema } from "@/lib/directory";

/**
 * Counts what readers do on a business page: view, call, website, directions.
 * One count per person per business per kind per day (IP hash), no bots.
 * These are the owner's monthly figures ("230 views, 14 calls").
 */
export const dynamic = "force-dynamic";
const KINDS = ["view", "call", "website", "directions"];
let ready = false;

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (!ua || /bot|crawl|spider|slurp|headless|preview|fetch|python|curl/i.test(ua)) return NextResponse.json({ ok: true });
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const b = (await req.json().catch(() => ({}))) as { slug?: string; kind?: string };
  if (!site || !b.slug || !KINDS.includes(String(b.kind))) return NextResponse.json({ ok: false }, { status: 400 });
  await dirSchema();
  if (!ready) {
    await pool.query(`CREATE TABLE IF NOT EXISTS business_events (business_id INT NOT NULL, kind VARCHAR(20) NOT NULL, day DATE NOT NULL, n INT NOT NULL DEFAULT 0, PRIMARY KEY (business_id, kind, day));
      CREATE TABLE IF NOT EXISTS business_event_seen (k TEXT PRIMARY KEY, day DATE NOT NULL)`);
    ready = true;
  }
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const { rows } = await pool.query(`SELECT id FROM businesses WHERE site_slug = $1 AND slug = $2`, [site.slug, String(b.slug).slice(0, 200)]);
  if (!rows[0]) return NextResponse.json({ ok: false }, { status: 404 });
  const k = crypto.createHash("sha256").update(`${ip}|${ua}|${rows[0].id}|${b.kind}|${new Date().toISOString().slice(0, 10)}`).digest("hex").slice(0, 40);
  const fresh = await pool.query(`INSERT INTO business_event_seen (k, day) VALUES ($1, current_date) ON CONFLICT DO NOTHING RETURNING k`, [k]);
  if (fresh.rows[0]) {
    await pool.query(`INSERT INTO business_events (business_id, kind, day, n) VALUES ($1, $2, current_date, 1) ON CONFLICT (business_id, kind, day) DO UPDATE SET n = business_events.n + 1`, [rows[0].id, b.kind]);
  }
  if (Math.random() < 0.01) await pool.query(`DELETE FROM business_event_seen WHERE day < current_date - 2`).catch(() => null);
  return NextResponse.json({ ok: true });
}
