import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ownerBusinesses } from "@/lib/directory-owner";
import { draftSite, siteSchema, THEMES, bizSiteFor, SECTIONS } from "@/lib/business-site";
import { llmJson } from "@/lib/llm-json";
import { stripe, bannedReason } from "@/lib/paid";

/** Owner actions on a Business Website: preview (AI draft), save, subscribe ($29/month or $249/year). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const PRICES = {
  standard: { month: Number(process.env.PRICE_SITE_MONTH_CENTS || 2900), year: Number(process.env.PRICE_SITE_YEAR_CENTS || 24900) },
  premium: { month: Number(process.env.PRICE_PREMIUM_MONTH_CENTS || 5900), year: Number(process.env.PRICE_PREMIUM_YEAR_CENTS || 54900) },
};
/** First month of a monthly plan costs this much (a one-time Stripe coupon for the difference). 0 turns it off. */
const FIRST_MONTH_CENTS = Number(process.env.PRICE_FIRST_MONTH_CENTS ?? 900);

/** The one-time "first month" coupon for a price, created once in Stripe and reused (fixed id). */
async function firstMonthCoupon(priceCents: number): Promise<string | null> {
  const off = priceCents - FIRST_MONTH_CENTS;
  if (!FIRST_MONTH_CENTS || off <= 0) return null;
  const id = `FIRSTMONTH_${priceCents}_${FIRST_MONTH_CENTS}`;
  try { await stripe("coupons", { id, amount_off: String(off), currency: "usd", duration: "once", name: `First month $${FIRST_MONTH_CENTS / 100}` }); }
  catch (e) { if (!/already exists/i.test((e as Error).message)) return null; }
  return id;
}

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
    const url = (v: unknown) => (/^https:\/\/[^\s]+$/.test(str(v, 400)) ? str(v, 400) : null);
    const hidden = Array.isArray(f.hidden) ? (f.hidden as unknown[]).map(String).filter((x) => (SECTIONS as readonly string[]).includes(x)) : [];
    await pool.query(`UPDATE business_sites SET logo_url = $2, booking_url = $3, video_url = $4, announcement = $5, hidden = $6 WHERE business_id = $1`,
      [biz.id, url(f.logo_url), url(f.booking_url), url(f.video_url), str(f.announcement, 140) || null, JSON.stringify(hidden)]);
    await pool.query(
      `UPDATE business_sites SET tagline = $2, about = $3, services = $4, faqs = $5, gallery = $6, hero_url = $7, theme = $8, accent = $9, cta_label = $10, contact_email = $11, updated_at = now() WHERE business_id = $1`,
      [biz.id, str(f.tagline, 120), str(f.about, 3000), JSON.stringify(services), JSON.stringify(faqs), JSON.stringify(gallery), /^https:\/\//.test(str(f.hero_url, 400)) ? str(f.hero_url, 400) : null, theme, accent, str(f.cta_label, 40) || null, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email) ? email : null]
    );
    return NextResponse.json({ ok: true });
  }
  // the design assistant: the owner says what they want, the AI returns the changed site (the owner reviews and saves)
  if (body.action === "ai_edit") {
    const instruction = String(body.instruction || "").trim().slice(0, 800);
    const current = (body.fields || {}) as Record<string, unknown>;
    if (instruction.length < 3) return NextResponse.json({ error: "Tell the assistant what you'd like." }, { status: 400 });
    const out = await llmJson<{ fields: Record<string, unknown>; note: string }>(`You are the website assistant of ${site.name}. A business owner edits their one-page website by giving you an instruction. Apply it to the CURRENT site JSON and return the full changed JSON.
Fields you can change: tagline (max 120 chars), about (paragraphs separated by blank lines), cta_label (max 40), theme ("classic" | "bold" | "minimal"), accent (hex colour like #1d4ed8), services [{name, price, desc}], faqs [{q, a}], announcement (a short top banner, max 140 chars, or ""), booking_url, video_url (YouTube/Vimeo), hidden (sections to hide, from: ${SECTIONS.join(", ")}).
RULES: never invent facts, prices, awards, years or services the owner did not give you or that are not already in the site; if the instruction needs information you don't have (e.g. a price or a link), keep the field as it is and say what's missing in "note". Logos and photos are uploaded by the owner, not by you. Keep everything else unchanged.
Return JSON {"fields": {...the full site...}, "note": "one short sentence telling the owner what you changed or what you need from them"}.
BUSINESS: ${biz.name}, ${biz.city}, ${site.state}. Phone: ${biz.phone || ""}.
CURRENT: ${JSON.stringify(current).slice(0, 9000)}
INSTRUCTION: ${instruction}`, 3500).catch(() => null);
    if (!out?.fields) return NextResponse.json({ error: "The assistant is busy. Try again in a moment." }, { status: 503 });
    // keep the uploaded media and anything the model dropped
    const merged = { ...current, ...out.fields, logo_url: current.logo_url, hero_url: current.hero_url, gallery: current.gallery, contact_email: current.contact_email, slug: current.slug, status: current.status };
    return NextResponse.json({ fields: merged, note: String(out.note || "Done.").slice(0, 300) });
  }
  if (body.action === "subscribe") {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
    const plan = body.plan === "year" ? "year" : "month";
    const level = body.level === "premium" ? "premium" : "standard";
    const s = await bizSiteFor(biz.id) || await draftSite(biz);
    const cents = PRICES[level][plan];
    const coupon = plan === "month" ? await firstMonthCoupon(cents) : null;
    const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
      mode: "subscription", customer_email: own.email,
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][unit_amount]": String(cents),
      "line_items[0][price_data][recurring][interval]": plan,
      "line_items[0][price_data][product_data][name]": `${level === "premium" ? "Premium" : "Standard"}: ${biz.name} on ${site.name}`.slice(0, 250),
      ...(coupon ? { "discounts[0][coupon]": coupon } : {}),
      "metadata[kind]": "business_site", "metadata[business_id]": String(biz.id), "metadata[plan]": plan, "metadata[level]": level,
      "subscription_data[metadata][kind]": "business_site", "subscription_data[metadata][business_id]": String(biz.id), "subscription_data[metadata][level]": level,
      success_url: `https://${site.domain}/b/${s.slug}?live=1`, cancel_url: `https://${site.domain}/directory/owner?t=${encodeURIComponent(String(body.token))}`,
    });
    return NextResponse.json({ url: session.url });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
