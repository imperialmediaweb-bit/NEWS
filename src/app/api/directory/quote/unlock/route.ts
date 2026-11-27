import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { stripe } from "@/lib/paid";
import { LEAD_CENTS, quoteSchema } from "@/lib/quotes";

/** A business pays to get a customer's contact from a quote request (link in the request email). */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const q = Number(req.nextUrl.searchParams.get("q")), b = Number(req.nextUrl.searchParams.get("b")), t = req.nextUrl.searchParams.get("t") || "";
  const msg = (text: string) => new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 16px;font-size:17px">${text}</body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (!site || !q || !b || t.length < 20) return msg("This link is not valid.");
  await quoteSchema();
  const { rows } = await pool.query(`SELECT s.unlocked_at, r.city FROM quote_sends s JOIN quote_requests r ON r.id = s.quote_id WHERE s.quote_id = $1 AND s.business_id = $2 AND s.token = $3`, [q, b, t]);
  if (!rows[0]) return msg("This link is not valid.");
  if (rows[0].unlocked_at) return msg("You already have this customer's contact: check your email.");
  if (!process.env.STRIPE_SECRET_KEY) return msg("Payments are not available right now.");
  const session = await stripe<{ url: string }>("checkout/sessions", {
    mode: "payment", "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][unit_amount]": String(LEAD_CENTS),
    "line_items[0][price_data][product_data][name]": `Customer request in ${rows[0].city} (${site.name})`.slice(0, 250),
    "metadata[kind]": "lead_unlock", "metadata[quote_id]": String(q), "metadata[business_id]": String(b),
    success_url: `https://${site.domain}/directory?lead=sent`, cancel_url: `https://${site.domain}/directory`,
  });
  return NextResponse.redirect(session.url, 303);
}
