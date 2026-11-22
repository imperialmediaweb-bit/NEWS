import crypto from "crypto";
import pool from "@/lib/db";

/**
 * Paid placements: a sponsored story ("Promote your business") and an
 * obituary. The customer writes it and pays by Stripe Checkout; the newsroom
 * reviews it in /admin/paid before it is published, clearly labelled.
 */
export const PRODUCTS = {
  sponsored: { name: "Sponsored story", cents: Number(process.env.PRICE_SPONSORED_CENTS || 4900) },
  obituary: { name: "Obituary", cents: Number(process.env.PRICE_OBITUARY_CENTS || 2500) },
} as const;
export type Product = keyof typeof PRODUCTS;

let ready: Promise<unknown> | null = null;
export function ensurePaidTable() {
  ready ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS paid_orders (
         id SERIAL PRIMARY KEY,
         site_slug VARCHAR(100) NOT NULL,
         product VARCHAR(20) NOT NULL,
         title TEXT NOT NULL,
         body TEXT NOT NULL,
         business TEXT,
         website TEXT,
         name TEXT NOT NULL,
         email TEXT NOT NULL,
         photo_url TEXT,
         cents INT NOT NULL,
         status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment',
         stripe_session TEXT,
         article_slug TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         paid_at TIMESTAMPTZ,
         published_at TIMESTAMPTZ
       );`
    )
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}

/** Stripe REST call (form-encoded), no SDK. */
export async function stripe<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${res.status}`);
  return json;
}

/** Verify a Stripe webhook signature (t=…,v1=…) against the raw body. */
export function verifyStripe(raw: string, header: string, secret: string, toleranceSec = 300): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const got = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return got.some((g) => g.length === expected.length && crypto.timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}
