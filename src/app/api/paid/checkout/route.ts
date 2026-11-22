import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { r2Put, r2Ready, r2Url } from "@/lib/r2";
import { ensurePaidTable, PRODUCTS, stripe, type Product } from "@/lib/paid";

/** POST /api/paid/checkout (multipart) — saves the order, returns the Stripe Checkout URL. */
export const dynamic = "force-dynamic";

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const form = await req.formData();
  if (clean(form.get("company_url"), 10)) return NextResponse.json({ ok: true }); // honeypot
  const product = clean(form.get("product"), 20) as Product;
  if (!(product in PRODUCTS)) return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  const title = clean(form.get("title"), 160);
  const body = clean(form.get("body"), 6000);
  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 200);
  const business = clean(form.get("business"), 160);
  const website = clean(form.get("website"), 300);
  if (title.length < 8 || body.length < 80) return NextResponse.json({ error: "Please add a headline and at least a short paragraph." }, { status: 400 });
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and a valid email." }, { status: 400 });
  if (product === "sponsored" && !business) return NextResponse.json({ error: "Please give the business name." }, { status: 400 });
  if (website && !/^https?:\/\//i.test(website)) return NextResponse.json({ error: "The website must start with http:// or https://" }, { status: 400 });
  if (form.get("consent") !== "on") return NextResponse.json({ error: "Please confirm the terms box." }, { status: 400 });

  let photoUrl: string | null = null;
  const photo = form.get("photo");
  if (photo && typeof photo !== "string" && photo.size > 0) {
    if (photo.size > 8 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/i.test(photo.type)) return NextResponse.json({ error: "The photo must be JPG, PNG or WebP, up to 8 MB." }, { status: 400 });
    if (r2Ready()) {
      const key = `paid/${site.slug}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${photo.type.split("/")[1].replace("jpeg", "jpg")}`;
      await r2Put(key, new Uint8Array(await photo.arrayBuffer()), photo.type);
      photoUrl = r2Url(key);
    }
  }

  await ensurePaidTable();
  const p = PRODUCTS[product];
  const { rows } = await pool.query(
    `INSERT INTO paid_orders (site_slug, product, title, body, business, website, name, email, photo_url, cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [site.slug, product, title, body, business || null, website || null, name, email, photoUrl, p.cents]
  );
  const id = rows[0].id;
  const back = product === "sponsored" ? "promote" : "obituaries/submit";
  const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
    mode: "payment",
    customer_email: email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(p.cents),
    "line_items[0][price_data][product_data][name]": `${p.name} — ${site.name}`,
    "metadata[order_id]": String(id),
    "metadata[site]": site.slug,
    success_url: `https://${site.domain}/${back}?paid=1`,
    cancel_url: `https://${site.domain}/${back}?cancelled=1`,
  });
  await pool.query("UPDATE paid_orders SET stripe_session = $2 WHERE id = $1", [id, session.id]);
  return NextResponse.json({ url: session.url });
}
