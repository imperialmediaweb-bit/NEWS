import crypto from "crypto";
import pool from "@/lib/db";
import { Resend } from "resend";
import type { SiteConfig } from "@/config/site-config";

/**
 * The daily email of each state's site. Double opt-in: an address is only
 * mailed after it clicks the confirmation link; every email carries a one-click
 * unsubscribe and the publisher's postal identity (CAN-SPAM).
 */
let ready: Promise<unknown> | null = null;
export function ensureNewsletterTable() {
  ready ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
         id SERIAL PRIMARY KEY,
         site_slug VARCHAR(100) NOT NULL,
         email TEXT NOT NULL,
         token TEXT NOT NULL,
         status VARCHAR(20) NOT NULL DEFAULT 'pending',
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         confirmed_at TIMESTAMPTZ,
         last_sent_at TIMESTAMPTZ,
         UNIQUE (site_slug, email)
       );`
    )
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}

export const newToken = () => crypto.randomBytes(18).toString("hex");

/** Sender for a site's mail. NEWSLETTER_FROM_DOMAIN must be a domain verified in Resend. */
export function senderFor(site: SiteConfig): string {
  const domain = process.env.NEWSLETTER_FROM_DOMAIN || "alabama-express.com";
  return `${site.name} <news@${domain}>`;
}

export async function sendMail(to: string, subject: string, html: string, from: string, headers?: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const r = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject, html, headers });
  if (r.error) throw new Error(r.error.message);
}
