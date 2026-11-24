import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ownerBusinesses } from "@/lib/directory-owner";
import { draftSite, siteSchema, THEMES, bizSiteFor } from "@/lib/business-site";
import { stripe, bannedReason } from "@/lib/paid";

/** Owner actions on a Business Website: preview (AI draft), save, subscribe ($29/month or $249/year). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const PRICES = { month: Number(process.env.PRICE_SITE_MONTH_CENTS || 2900), year: Number(process.env.PRICE_SITE_YEAR_CENTS || 24900) };

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const own = await ownerBusinesses(String(body.token || ""), site.slug);
  if (!own) return NextResponse.json({ error: "Your link has expired. Ask for a new one." }, { status: 401 });
  const biz = own.businesses.find((x: { id: number }) => x.id === Number(body.businessId));
  if (!biz) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  await siteSchema();

  if (body.action === "preview") {
    const s = await draftSite(biz);
    return NextResponse.json({ ok: true, slug: s.slug });
  }
  if (body.action === "save") {
    const f = (body.fields || {}) as Record<string, unknown>;
    const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
    const services = Array.isArray(f.services) ? (f.services as Array<Record<string, unknown>>).slice(0, 20).map((x) => ({ name: str(x.name, 80), price: str(x.price, 30), desc: str(x.desc, 240) })).filter((x) => x.name) : [];
    const faqs = Array.isArray(f.faqs) ? (f.faqs as Array<Record<string, unknown>>).slice(0, 15).map((x) => ({ q: str(x.q, 160), a: str(x.a, 600) })).filter((x) => x.q && x.a) : [];
    const gallery = Array.isArray(f.gallery) ? (f.gallery as unknown[]).map((u) => str(u, 400)).filter((u) => /^https:\/\//.test(u)).slice(0, 12) : [];
    const theme = (THEMES as readonly string[]).includes(String(f.theme)) ? String(f.theme) : "classic";
    const accent = /^#[0-9a-f]{6}$/i.test(String(f.accent || "")) ? String(f.accent) : null;
    const email = str(f.contact_email, 200);
    const banned = bannedReason(str(f.tagline, 120), str(f.about, 3000), services.map((s) => `${s.name} ${s.desc}`).join(" "));
    if (banned) return NextResponse.json({ error: `We can't publish content related to ${banned}.` }, { status: 400 });
    await pool.query(
      `UPDATE business_sites SET tagline = $2, about = $3, services = $4, faqs = $5, gallery = $6, hero_url = $7, theme = $8, accent = $9, cta_label = $10, contact_email = $11, updated_at = now() WHERE business_id = $1`,
      [biz.id, str(f.tagline, 120), str(f.about, 3000), JSON.stringify(services), JSON.stringify(faqs), JSON.stringify(gallery), /^https:\/\//.test(str(f.hero_url, 400)) ? str(f.hero_url, 400) : null, theme, accent, str(f.cta_label, 40) || null, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email) ? email : null]
    );
    return NextResponse.json({ ok: true });
  }
  if (body.action === "subscribe") {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
    const plan = body.plan === "year" ? "year" : "month";
    const s = await bizSiteFor(biz.id) || await draftSite(biz);
    const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
      mode: "subscription", customer_email: own.email,
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][unit_amount]": String(PRICES[plan]),
      "line_items[0][price_data][recurring][interval]": plan, "line_items[0][price_data][product_data][name]": `Business Website: ${biz.name} on ${site.name}`.slice(0, 250),
      "metadata[kind]": "business_site", "metadata[business_id]": String(biz.id), "metadata[plan]": plan,
      "subscription_data[metadata][kind]": "business_site", "subscription_data[metadata][business_id]": String(biz.id),
      success_url: `https://${site.domain}/b/${s.slug}?live=1`, cancel_url: `https://${site.domain}/directory/owner?t=${encodeURIComponent(String(body.token))}`,
    });
    return NextResponse.json({ url: session.url });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
