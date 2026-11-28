import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { r2Put, r2Ready, r2Url } from "@/lib/r2";
import { slugOf } from "@/lib/topic-page";
import { ensurePaidTable, PRODUCTS, stripe, bannedReason } from "@/lib/paid";
import { dirSchema, getBusiness, uniqueSlug, EDITABLE } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { Resend } from "resend";
import { ADMIN_URL } from "@/lib/admin-url";

/**
 * POST (multipart) from /directory/join.
 *  mode=new   → a business not in the directory yet
 *  mode=claim → an existing listing (business_slug), with the owner's corrections
 *  tier=free  → saved for review (free listing / free claim), the newsroom is emailed
 *  tier=spotlight | spotlight_home → Stripe Checkout; on payment the listing is
 *  upgraded and the profile article goes live 24 hours later unless declined.
 */
export const dynamic = "force-dynamic";
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const url = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const f = await req.formData();
  if (clean(f.get("company_url"), 10)) return NextResponse.json({ ok: true }); // honeypot
  const mode = clean(f.get("mode"), 10) === "claim" ? "claim" : "new";
  const tier = clean(f.get("tier"), 20);
  if (!["free", "spotlight", "spotlight_home"].includes(tier)) return NextResponse.json({ error: "Choose a plan." }, { status: 400 });
  const d: Record<string, string> = {};
  for (const k of EDITABLE) if (k !== "photo_url") d[k] = clean(f.get(k), k === "description" ? 900 : 300);
  d.website = url(d.website); d.facebook = url(d.facebook); d.instagram = url(d.instagram);
  const owner = clean(f.get("owner_name"), 120), email = clean(f.get("owner_email"), 200);
  if (!owner || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and a valid email." }, { status: 400 });
  if (clean(f.get("consent"), 5) !== "on") return NextResponse.json({ error: "Please confirm the box at the end." }, { status: 400 });
  if (!d.name || !d.city || !catBySlug(d.category)) return NextResponse.json({ error: "Business name, city and category are required." }, { status: 400 });
  if (!d.phone && !d.website) return NextResponse.json({ error: "Add a phone number or a website so customers can reach you." }, { status: 400 });
  for (const k of ["website", "facebook", "instagram"]) if (d[k] && !/^https:\/\/[^\s/]+\.[^\s]+$/i.test(d[k].replace(/^http:/, "https:"))) return NextResponse.json({ error: `The ${k} address doesn't look right.` }, { status: 400 });
  // the sender's network address, hashed: same person behind several names/emails
  const ipHash = crypto.createHash("sha256").update(`${process.env.CRON_SECRET || ""}:${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?"}`).digest("hex").slice(0, 32);
  const banned = bannedReason(d.name, d.description, clean(f.get("article"), 6000), d.website);
  if (banned) return NextResponse.json({ error: `We can't list businesses related to ${banned}. Nothing was charged.` }, { status: 400 });

  await dirSchema();
  const photo = f.get("photo");
  if (photo && typeof photo !== "string" && photo.size > 0) {
    if (photo.size > 8 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/i.test(photo.type)) return NextResponse.json({ error: "The photo must be JPG, PNG or WebP, up to 8 MB." }, { status: 400 });
    if (r2Ready()) {
      const key = `directory/${site.slug}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${photo.type.split("/")[1].replace("jpeg", "jpg")}`;
      // a failed photo upload must not lose the listing: save it without the photo
      try {
        await r2Put(key, new Uint8Array(await photo.arrayBuffer()), photo.type);
        d.photo_url = r2Url(key);
      } catch (e) { console.error("[directory] photo upload failed:", (e as Error).message); }
    }
  }

  // the business row: existing (claim) or a new pending one
  let businessId: number;
  let slug: string;
  if (mode === "claim") {
    const b = await getBusiness(site.slug, clean(f.get("business_slug"), 200));
    if (!b) return NextResponse.json({ error: "We couldn't find that listing." }, { status: 400 });
    businessId = b.id; slug = b.slug;
  } else {
    slug = await uniqueSlug(site.slug, d.name, slugOf(d.city));
    const { rows } = await pool.query(
      `INSERT INTO businesses (site_slug, slug, name, category, city, city_slug, address, zip, phone, website, hours, description, facebook, instagram, photo_url, owner_email, source, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'owner','pending') RETURNING id`,
      [site.slug, slug, d.name, d.category, d.city, slugOf(d.city), d.address || null, d.zip || null, d.phone || null, d.website || null, d.hours || null, d.description || null, d.facebook || null, d.instagram || null, d.photo_url || null, email]
    );
    businessId = rows[0].id;
  }
  const srcInfo = clean(f.get("src"), 1500) || JSON.stringify({ ref: req.headers.get("referer") || "" });
  const { rows: cl } = await pool.query(`INSERT INTO business_claims (business_id, site_slug, data, name, email, source_info, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [businessId, site.slug, JSON.stringify(d), owner, email, srcInfo, ipHash]);
  const claimId = cl[0].id;

  if (tier === "free") {
    if (process.env.RESEND_API_KEY) {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `${site.name} <contact@alabama-express.com>`, to: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
        subject: `[Directory] ${mode === "claim" ? "Claim" : "New free listing"}: ${d.name} (${d.city})`.slice(0, 180),
        html: `<p>${mode === "claim" ? "Claim request" : "New free listing"} on ${site.name}: <b>${d.name}</b>, ${d.city}, from ${owner} &lt;${email}&gt;.</p><p><a href="${ADMIN_URL}/admin/directory">Approve or reject</a></p>`,
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true, review: true });
  }

  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
  const title = clean(f.get("article_title"), 140) || `${d.name}: a ${catBySlug(d.category)!.one} in ${d.city}`;
  const article = clean(f.get("article"), 6000) || d.description;
  if (article.length < 120) return NextResponse.json({ error: "The Spotlight article needs a few sentences. Use \"Write it for me\" or write it yourself." }, { status: 400 });
  await ensurePaidTable();
  const p = PRODUCTS[tier as "spotlight" | "spotlight_home"];
  const { rows: o } = await pool.query(
    `INSERT INTO paid_orders (site_slug, product, title, body, business, website, name, email, photo_url, cents, city, phone, business_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [site.slug, tier, title, article, d.name, d.website || null, owner, email, d.photo_url || null, p.cents, d.city, d.phone || null, businessId]
  );
  const orderId = o[0].id;
  await pool.query(`UPDATE business_claims SET order_id = $2 WHERE id = $1`, [claimId, orderId]);
  const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
    mode: "payment",
    customer_email: email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(p.cents),
    "line_items[0][price_data][product_data][name]": `${p.name}: ${d.name} on ${site.name}`.slice(0, 250),
    "metadata[order_id]": String(orderId),
    "metadata[site]": site.slug,
    "metadata[claim_id]": String(claimId),
    success_url: `https://${site.domain}/directory/join?paid=1&b=${encodeURIComponent(slug)}`,
    cancel_url: `https://${site.domain}/directory/join?cancelled=1`,
  });
  await pool.query("UPDATE paid_orders SET stripe_session = $2 WHERE id = $1", [orderId, session.id]);
  return NextResponse.json({ url: session.url });
}
