import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { catBySlug } from "@/lib/directory-categories";
import { createQuote, quoteSchema } from "@/lib/quotes";

/** "Get quotes" form: a customer's job goes to up to 3 local businesses in that category. */
export const dynamic = "force-dynamic";
const clean = (v: unknown, max: number) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  if (clean(b.company_url, 10)) return NextResponse.json({ ok: true, sent: 0, call: [] }); // honeypot
  const name = clean(b.name, 120), email = clean(b.email, 200), phone = clean(b.phone, 40), zip = clean(b.zip, 12), details = clean(b.details, 2000);
  const category = clean(b.category, 60), city_slug = clean(b.city_slug, 120), city = clean(b.city, 120);
  if (!catBySlug(category) || !city_slug || !city) return NextResponse.json({ error: "Missing category or city." }, { status: 400 });
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and a valid email." }, { status: 400 });
  if (details.length < 15) return NextResponse.json({ error: "Tell us a little about the job (a sentence or two)." }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: "Please tick the box so we can share your request with local businesses." }, { status: 400 });
  await quoteSchema();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  const { rows } = await pool.query(`SELECT COUNT(*)::int n FROM quote_requests WHERE (ip_hash = $1 OR lower(email) = lower($2)) AND created_at > now() - interval '24 hours'`, [ipHash, email]);
  if ((rows[0]?.n || 0) >= 3) return NextResponse.json({ error: "You've sent several requests today. Please try again tomorrow." }, { status: 429 });
  const out = await createQuote({ site: site.slug, city_slug, city, category, name, email, phone, zip, details, ipHash });
  return NextResponse.json({ ok: true, ...out });
}
