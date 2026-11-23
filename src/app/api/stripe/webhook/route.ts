import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensurePaidTable, verifyStripe, PRODUCTS, type Product } from "@/lib/paid";
import { Resend } from "resend";
import { applyClaim } from "@/lib/directory";

/** Stripe webhook: checkout.session.completed marks the order paid and tells the newsroom. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.STRIPE_NEWS_WEBHOOK_SECRET;
  if (!secret || !verifyStripe(raw, req.headers.get("stripe-signature") || "", secret)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; subscription?: string | null; metadata?: Record<string, string> } } };
  await ensurePaidTable();
  // a directory listing's subscription ended (cancelled or unpaid): take it off the site
  if (event.type === "customer.subscription.deleted") {
    await pool.query("UPDATE paid_orders SET status = 'ended' WHERE stripe_subscription = $1 AND product = 'listing'", [event.data.object.id]);
    return NextResponse.json({ ok: true });
  }
  if (event.type !== "checkout.session.completed" || event.data.object.payment_status !== "paid") return NextResponse.json({ ok: true });
  const id = Number(event.data.object.metadata?.order_id);
  const { rows } = await pool.query(
    "UPDATE paid_orders SET status = 'paid', paid_at = now(), stripe_subscription = COALESCE($3, stripe_subscription) WHERE id = $1 AND stripe_session = $2 AND status = 'awaiting_payment' RETURNING *",
    [id, event.data.object.id, event.data.object.subscription || null]
  );
  const o = rows[0];
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
