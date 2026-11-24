import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, dirSchema } from "@/lib/directory";
import { ensurePaidTable, PRODUCTS, stripe, bannedReason } from "@/lib/paid";

/** A business posts a deal or coupon ($19, up to 30 days): saved, then Stripe Checkout; live on payment. */
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const s = (k: string, n: number) => String(b[k] || "").trim().slice(0, n);
  const title = s("title", 90), details = s("details", 400), code = s("code", 30), name = s("name", 120), email = s("email", 200);
  const days = Math.min(30, Math.max(1, parseInt(s("days", 3), 10) || 14));
  if (title.length < 5) return NextResponse.json({ error: "Write the deal in a few words, e.g. “20% off oil changes”." }, { status: 400 });
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and a valid email." }, { status: 400 });
  if (s("consent", 5) !== "on") return NextResponse.json({ error: "Please confirm the box." }, { status: 400 });
  const biz = await getBusiness(site.slug, s("slug", 200));
  if (!biz) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const banned = bannedReason(title, details, biz.name);
  if (banned) return NextResponse.json({ error: `We can't publish deals related to ${banned}. Nothing was charged.` }, { status: 400 });
  await dirSchema(); await ensurePaidTable();
  const p = PRODUCTS.deal;
  const { rows: o } = await pool.query(
    `INSERT INTO paid_orders (site_slug, product, title, body, business, website, name, email, cents, city, business_id) VALUES ($1,'deal',$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [site.slug, title, details || title, biz.name, biz.website, name, email, p.cents, biz.city, biz.id]
  );
  await pool.query(`INSERT INTO business_deals (business_id, site_slug, title, details, code, expires_at, order_id) VALUES ($1,$2,$3,$4,$5, current_date + $6::int, $7)`, [biz.id, site.slug, title, details || null, code || null, days, o[0].id]);
  const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
    mode: "payment", customer_email: email,
    "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][unit_amount]": String(p.cents),
    "line_items[0][price_data][product_data][name]": `Deal for ${biz.name} on ${site.name} (${days} days)`.slice(0, 250),
    "metadata[order_id]": String(o[0].id), "metadata[site]": site.slug,
    success_url: `https://${site.domain}/directory/listing/${biz.slug}?deal=1`, cancel_url: `https://${site.domain}/directory/deal?b=${biz.slug}&cancelled=1`,
  });
  await pool.query("UPDATE paid_orders SET stripe_session = $2 WHERE id = $1", [o[0].id, session.id]);
  return NextResponse.json({ url: session.url });
}
