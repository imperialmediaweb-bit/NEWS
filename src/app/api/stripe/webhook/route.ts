import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensurePaidTable, verifyStripe, PRODUCTS, type Product } from "@/lib/paid";
import { Resend } from "resend";

/** Stripe webhook: checkout.session.completed marks the order paid and tells the newsroom. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.STRIPE_NEWS_WEBHOOK_SECRET;
  if (!secret || !verifyStripe(raw, req.headers.get("stripe-signature") || "", secret)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; metadata?: Record<string, string> } } };
  if (event.type !== "checkout.session.completed" || event.data.object.payment_status !== "paid") return NextResponse.json({ ok: true });
  const id = Number(event.data.object.metadata?.order_id);
  await ensurePaidTable();
  const { rows } = await pool.query(
    "UPDATE paid_orders SET status = 'paid', paid_at = now() WHERE id = $1 AND stripe_session = $2 AND status = 'awaiting_payment' RETURNING *",
    [id, event.data.object.id]
  );
  const o = rows[0];
  if (o && process.env.RESEND_API_KEY) {
    const site = sites[o.site_slug];
    await new Resend(process.env.RESEND_API_KEY).emails
      .send({
        from: `${site?.name || "Express"} <contact@alabama-express.com>`,
        to: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
        subject: `[PAID $${(o.cents / 100).toFixed(2)}] ${PRODUCTS[o.product as Product]?.name}: ${o.title}`.slice(0, 180),
        html: `<p>New paid ${o.product} on ${site?.name} from ${o.name} &lt;${o.email}&gt;.</p><p><a href="https://${site?.domain}/admin/paid">Review and publish</a></p>`,
      })
      .catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
