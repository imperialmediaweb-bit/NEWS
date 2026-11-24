import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/paid";

/** Make sure the news webhook also receives subscription cancellations (directory listings). */
export const dynamic = "force-dynamic";
const NEEDED = ["checkout.session.completed", "customer.subscription.deleted", "invoice.payment_failed", "invoice.paid"];

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") || process.env.STRIPE_NEWS_WEBHOOK_ID || "we_1UefiGGIdp4dYpth3Gj1De3i";
  const cur = await fetch(`https://api.stripe.com/v1/webhook_endpoints/${id}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }).then((r) => r.json());
  if (cur.error) return NextResponse.json({ error: cur.error.message }, { status: 400 });
  const events: string[] = cur.enabled_events || [];
  if (events.includes("*") || NEEDED.every((e) => events.includes(e))) return NextResponse.json({ ok: true, events });
  const all = Array.from(new Set([...events, ...NEEDED]));
  const params: Record<string, string> = {};
  all.forEach((e, i) => { params[`enabled_events[${i}]`] = e; });
  const upd = await stripe<{ enabled_events: string[] }>(`webhook_endpoints/${id}`, params);
  return NextResponse.json({ ok: true, events: upd.enabled_events });
}
