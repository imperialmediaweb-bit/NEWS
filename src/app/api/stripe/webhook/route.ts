import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensurePaidTable, verifyStripe, PRODUCTS, type Product } from "@/lib/paid";
import { Resend } from "resend";
import { applyClaim } from "@/lib/directory";

/** Stripe webhook: checkout.session.completed marks the order paid and tells the newsroom. */
export const dynamic = "force-dynamic";

const ADMIN_TO = () => process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com";
const esc = (v: unknown) => String(v ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

/** Short plain emails for subscription events; never throw. */
async function notify(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !to) return;
  await new Resend(process.env.RESEND_API_KEY).emails.send({ from: "Express Business <contact@alabama-express.com>", to, subject: subject.slice(0, 180), html }).catch(() => null);
}

/** The business behind a website subscription, for the notifications. */
async function siteBySub(sub: string) {
  const { rows } = await pool.query(
    `SELECT s.business_id, s.level, s.plan, s.slug AS web_slug, b.name, b.city, b.site_slug, b.owner_email
       FROM business_sites s JOIN businesses b ON b.id = s.business_id WHERE s.stripe_subscription = $1`, [sub]).catch(() => ({ rows: [] }));
  return rows[0] as { business_id: number; level: string; plan: string; web_slug: string; name: string; city: string; site_slug: string; owner_email: string | null } | undefined;
}

/** Premium keeps the business first in its city list while paid (a few days of grace past each period). */
async function extendPremium(businessId: number, plan: string) {
  await pool.query(`UPDATE businesses SET tier = 'premium', tier_until = now() + ($2)::interval, updated_at = now() WHERE id = $1 AND tier IN ('free', 'premium')`,
    [businessId, plan === "year" ? "1 year 7 days" : "1 month 7 days"]).catch(() => null);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.STRIPE_NEWS_WEBHOOK_SECRET;
  if (!secret || !verifyStripe(raw, req.headers.get("stripe-signature") || "", secret)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; subscription?: string | null; metadata?: Record<string, string> } } };
  await ensurePaidTable();
  // a directory listing's subscription ended (cancelled or unpaid): take it off the site
  if (event.type === "customer.subscription.deleted") {
    await pool.query("UPDATE paid_orders SET status = 'ended' WHERE stripe_subscription = $1 AND product = 'listing'", [event.data.object.id]);
    await pool.query("UPDATE business_sites SET status = 'canceled' WHERE stripe_subscription = $1", [event.data.object.id]).catch(() => null);
    const b = await siteBySub(event.data.object.id);
    if (b) await notify(ADMIN_TO(), `[Website] Canceled: ${b.name} (${b.city})`, `<p>The ${esc(b.level)} subscription of <b>${esc(b.name)}</b>, ${esc(b.city)} (${esc(sites[b.site_slug]?.name)}) ended. The website is offline.</p>`);
    return NextResponse.json({ ok: true });
  }
  // a failed renewal pauses the Business Website until it is paid
  if (event.type === "invoice.payment_failed") {
    const inv = event.data.object as unknown as { subscription?: string; hosted_invoice_url?: string; customer_email?: string; amount_due?: number };
    const sub = inv.subscription;
    if (sub) await pool.query("UPDATE business_sites SET status = 'past_due' WHERE stripe_subscription = $1", [sub]).catch(() => null);
    const b = sub ? await siteBySub(sub) : undefined;
    if (b) {
      const site = sites[b.site_slug];
      await notify(ADMIN_TO(), `[Website] Payment failed: ${b.name} (${b.city})`, `<p>A payment of $${((inv.amount_due || 0) / 100).toFixed(2)} for <b>${esc(b.name)}</b> (${esc(site?.name)}) failed. The website is paused until it is paid. The owner was emailed a link to update the card.</p>`);
      const to = inv.customer_email || b.owner_email || "";
      if (inv.hosted_invoice_url) await notify(to, `Your ${site?.name || "website"} payment didn't go through`,
        `<p>Hello,</p><p>We couldn't charge your card for the website of <b>${esc(b.name)}</b>, so it is paused for now.</p><p><a href="${esc(inv.hosted_invoice_url)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Update your card and pay</a></p><p>As soon as the payment goes through, your website is back online, with nothing lost.</p><p>${esc(site?.name)}</p>`);
    }
    return NextResponse.json({ ok: true });
  }
  if (event.type === "invoice.paid") {
    const sub = (event.data.object as unknown as { subscription?: string }).subscription;
    if (sub) await pool.query("UPDATE business_sites SET status = 'active' WHERE stripe_subscription = $1 AND status IN ('past_due', 'active')", [sub]).catch(() => null);
    const b = sub ? await siteBySub(sub) : undefined;
    if (b?.level === "premium") await extendPremium(b.business_id, b.plan);
    return NextResponse.json({ ok: true });
  }
  // Business Website subscription started
  if (event.type === "checkout.session.completed" && event.data.object.metadata?.kind === "business_site") {
    const m = event.data.object.metadata;
    const level = m.level === "premium" ? "premium" : "standard", plan = m.plan || "month";
    await pool.query("UPDATE business_sites SET status = 'active', plan = $2, stripe_subscription = $3, level = $4, updated_at = now() WHERE business_id = $1",
      [Number(m.business_id), plan, event.data.object.subscription || null, level]).catch(() => null);
    if (level === "premium") await extendPremium(Number(m.business_id), plan);
    const b = event.data.object.subscription ? await siteBySub(event.data.object.subscription) : undefined;
    if (b) await notify(ADMIN_TO(), `[Website] New ${level}: ${b.name} (${b.city})`, `<p><b>${esc(b.name)}</b>, ${esc(b.city)} bought <b>${esc(level)}</b> (${esc(plan === "year" ? "yearly" : "monthly")}) on ${esc(sites[b.site_slug]?.name)}.</p><p><a href="https://${esc(sites[b.site_slug]?.domain)}/b/${esc(b.web_slug)}">See the website</a></p>`);
    return NextResponse.json({ ok: true });
  }
  // a business paid for a customer's contact (quote request)
  if (event.type === "checkout.session.completed" && event.data.object.metadata?.kind === "lead_unlock" && event.data.object.payment_status === "paid") {
    const { unlockLead } = await import("@/lib/quotes");
    await unlockLead(Number(event.data.object.metadata.quote_id), Number(event.data.object.metadata.business_id)).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  if (event.type !== "checkout.session.completed" || event.data.object.payment_status !== "paid") return NextResponse.json({ ok: true });
  const id = Number(event.data.object.metadata?.order_id);
  const { rows } = await pool.query(
    "UPDATE paid_orders SET status = 'paid', paid_at = now(), stripe_subscription = COALESCE($3, stripe_subscription) WHERE id = $1 AND stripe_session = $2 AND status = 'awaiting_payment' RETURNING *",
    [id, event.data.object.id, event.data.object.subscription || null]
  );
  const o = rows[0];
  // a paid news brief goes live within the hour (the editor can still decline it in /admin/paid)
  if (o && o.product === "news_brief") await pool.query("UPDATE paid_orders SET auto_publish_at = now() + interval '1 hour' WHERE id = $1", [o.id]);
  // Business Spotlight: the listing upgrades now, the profile article goes live in 24 hours unless declined
  if (o && (o.product === "spotlight" || o.product === "spotlight_home") && o.business_id) {
    await pool.query("UPDATE paid_orders SET auto_publish_at = now() + interval '24 hours' WHERE id = $1", [o.id]);
    // the owner's fields from the form (a paid Spotlight counts as proof of ownership)
    const claimId = Number(event.data.object.metadata?.claim_id);
    if (claimId) await applyClaim(claimId).catch(() => null);
    await pool.query(
      `UPDATE businesses SET tier = $2, tier_until = now() + interval '12 months', claimed = TRUE, status = 'active',
              owner_email = COALESCE(owner_email, $3), photo_url = COALESCE($4, photo_url), website = COALESCE($5, website), updated_at = now()
        WHERE id = $1`,
      [o.business_id, o.product, o.email, o.photo_url, o.website]
    ).catch(() => null);
  }
  // a paid deal goes live at once (it was checked against the banned list before payment; the editor can still decline it)
  if (o && o.product === "deal") {
    await pool.query("UPDATE business_deals SET status = 'live' WHERE order_id = $1", [o.id]).catch(() => null);
    await pool.query("UPDATE paid_orders SET status = 'published', published_at = now() WHERE id = $1", [o.id]).catch(() => null);
  }
  if (o && process.env.RESEND_API_KEY) {
    const site = sites[o.site_slug];
    await new Resend(process.env.RESEND_API_KEY).emails
      .send({
        from: `${site?.name || "Express"} <contact@alabama-express.com>`,
        to: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
        subject: `[PAID $${(o.cents / 100).toFixed(2)}${o.product === "listing" ? "/month" : ""}] ${PRODUCTS[o.product as Product]?.name}: ${o.title}`.slice(0, 180),
        html: o.product === "spotlight" || o.product === "spotlight_home"
          ? `<p>New Business Spotlight on ${site?.name}: <b>${o.business || o.title}</b> (${o.name} &lt;${o.email}&gt;).</p><p>The listing is upgraded now. The profile article <b>goes live automatically in 24 hours</b>. To stop it, open <a href="https://${site?.domain}/admin/paid">admin / paid</a> and press "Decline &amp; refund".</p>`
          : `<p>New paid ${o.product} on ${site?.name} from ${o.name} &lt;${o.email}&gt;.</p><p><a href="https://${site?.domain}/admin/paid">Review and publish</a></p>`,
      })
      .catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
