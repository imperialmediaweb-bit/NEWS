import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ownerBusinesses } from "@/lib/directory-owner";
import { bizSiteFor, isLive } from "@/lib/business-site";
import { catBySlug } from "@/lib/directory-categories";
import { llmJson } from "@/lib/llm-json";
import { ensurePaidTable, stripe, bannedReason } from "@/lib/paid";

/**
 * "News in 10 minutes": the owner types their news in a sentence or two, the
 * AI writes a short brief (only from what they wrote and their listing), and
 * it goes live within the hour, labelled as sponsored. One a month is
 * included with a website subscription; otherwise $19 (BRIEF_CENTS).
 *  POST {token, businessId, text, action: "draft"}        -> {title, body}
 *  POST {token, businessId, title, body, action: "publish"} -> {scheduled} or {url} (checkout)
 */
export const dynamic = "force-dynamic";
const BRIEF_CENTS = Number(process.env.PRICE_BRIEF_CENTS || 1900);

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const own = await ownerBusinesses(String(body.token || ""), site.slug).catch(() => null);
  const b = own?.businesses.find((x: { id: number }) => x.id === Number(body.businessId)) as Record<string, string | number | null> | undefined;
  if (!b) return NextResponse.json({ error: "Your link has expired. Open the dashboard again from your latest email." }, { status: 401 });
  await ensurePaidTable();

  if (body.action === "draft") {
    const text = String(body.text || "").trim().slice(0, 600);
    if (text.length < 15) return NextResponse.json({ error: "Tell us the news in a sentence or two." }, { status: 400 });
    const banned = bannedReason(String(b.name), text, "", String(b.website || ""));
    if (banned) return NextResponse.json({ error: `We can't publish news related to ${banned}.` }, { status: 400 });
    const cat = catBySlug(String(b.category));
    const out = await llmJson<{ title?: string; body?: string }>(`Write a short local business news brief for ${site.name} (${site.state}). It will be labelled as sponsored.
BUSINESS: ${b.name}, a ${cat?.one || "business"} in ${b.city}, ${site.state}.${b.address ? ` Address: ${b.address}.` : ""}${b.phone ? ` Phone: ${b.phone}.` : ""}${b.website ? ` Website: ${b.website}.` : ""}
THE OWNER'S NEWS (the only new facts you may use): "${text}"
RULES: 120-220 words, news style (who, what, where, when), plain paragraphs separated by a blank line, third person, no quotes unless the owner wrote one, no invented facts, dates, prices, numbers, awards or claims, no "best"/"#1", no exclamation marks. End with one line on how to reach the business, using only the phone/website above. American English.
Return JSON: {"title": "headline under 90 characters", "body": "the brief"}`, 1200).catch(() => null);
    const title = String(out?.title || "").trim().slice(0, 140), draft = String(out?.body || "").trim().slice(0, 3000);
    if (title.length < 8 || draft.length < 200) return NextResponse.json({ error: "The writing assistant is busy. Try again in a minute." }, { status: 503 });
    return NextResponse.json({ title, body: draft });
  }

  if (body.action === "publish") {
    const title = String(body.title || "").trim().slice(0, 140), text = String(body.body || "").trim().slice(0, 3000);
    if (title.length < 8 || text.length < 120) return NextResponse.json({ error: "The headline or the text is too short." }, { status: 400 });
    const bsite = await bizSiteFor(Number(b.id)).catch(() => null);
    const { rows: used } = await pool.query(`SELECT 1 FROM paid_orders WHERE business_id = $1 AND product = 'news_brief' AND cents = 0 AND created_at >= date_trunc('month', now()) LIMIT 1`, [b.id]);
    const included = !!bsite && isLive(bsite) && !used.length;
    const { rows } = await pool.query(
      `INSERT INTO paid_orders (site_slug, product, title, body, business, website, name, email, photo_url, cents, city, phone, business_id, status, auto_publish_at)
       VALUES ($1,'news_brief',$2,$3,$4,$5,$4,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [site.slug, title, text, b.name, b.website, own!.email, b.photo_url, included ? 0 : BRIEF_CENTS, b.city, b.phone, b.id, included ? "paid" : "awaiting_payment", included ? new Date(Date.now() + 60 * 60 * 1000) : null]);
    if (included) return NextResponse.json({ scheduled: true, note: "Included with your website. It goes live within the hour." });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Payments are not set up yet." }, { status: 503 });
    const session = await stripe<{ id: string; url: string }>("checkout/sessions", {
      mode: "payment", customer_email: own!.email, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(BRIEF_CENTS), "line_items[0][price_data][product_data][name]": `News brief: ${b.name} on ${site.name}`.slice(0, 250),
      "metadata[order_id]": String(rows[0].id), "metadata[site]": site.slug,
      success_url: `https://${site.domain}/directory/owner?t=${encodeURIComponent(String(body.token))}&brief=1`, cancel_url: `https://${site.domain}/directory/owner?t=${encodeURIComponent(String(body.token))}`,
    });
    await pool.query("UPDATE paid_orders SET stripe_session = $2 WHERE id = $1", [rows[0].id, session.id]);
    return NextResponse.json({ url: session.url });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
