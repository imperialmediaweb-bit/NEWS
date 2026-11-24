import crypto from "crypto";
import pool from "@/lib/db";
import { dirSchema } from "@/lib/directory";

/** Owner sign-in by emailed link: a token valid 7 days for the email that claimed the listing(s). */
export async function ownerSchema() {
  await dirSchema();
  await pool.query(`CREATE TABLE IF NOT EXISTS owner_tokens (token TEXT PRIMARY KEY, email TEXT NOT NULL, site_slug VARCHAR(100) NOT NULL, expires_at TIMESTAMPTZ NOT NULL)`);
}
export async function newOwnerToken(email: string, site: string) {
  await ownerSchema();
  const token = crypto.randomBytes(24).toString("hex");
  await pool.query(`INSERT INTO owner_tokens (token, email, site_slug, expires_at) VALUES ($1, lower($2), $3, now() + interval '7 days')`, [token, email, site]);
  return token;
}
/** The businesses this token's email owns on this site (claimed ones). */
export async function ownerBusinesses(token: string, site: string) {
  await ownerSchema();
  const { rows: t } = await pool.query(`SELECT email FROM owner_tokens WHERE token = $1 AND site_slug = $2 AND expires_at > now()`, [String(token).slice(0, 64), site]);
  if (!t[0]) return null;
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE site_slug = $1 AND lower(owner_email) = $2 AND status <> 'hidden' ORDER BY name`, [site, t[0].email]);
  return { email: t[0].email as string, businesses: rows };
}
export async function ownerStats(businessId: number, days = 30) {
  await pool.query(`CREATE TABLE IF NOT EXISTS business_events (business_id INT NOT NULL, kind VARCHAR(20) NOT NULL, day DATE NOT NULL, n INT NOT NULL DEFAULT 0, PRIMARY KEY (business_id, kind, day))`);
  const { rows } = await pool.query(`SELECT kind, SUM(n)::int n FROM business_events WHERE business_id = $1 AND day > current_date - $2::int GROUP BY kind`, [businessId, days]);
  return Object.fromEntries(rows.map((r: { kind: string; n: number }) => [r.kind, r.n])) as Record<string, number>;
}

/** Welcome email to a business owner (after approval or payment): dashboard link and what they can do there. */
export async function sendOwnerWelcome(siteSlug: string, businessId: number) {
  if (!process.env.RESEND_API_KEY) return false;
  const { sites } = await import("@/config/sites");
  const { Resend } = await import("resend");
  const site = sites[siteSlug];
  const { rows } = await pool.query(`SELECT name, slug, city, owner_email FROM businesses WHERE id = $1`, [businessId]);
  const b = rows[0];
  if (!site || !b?.owner_email) return false;
  const token = await newOwnerToken(b.owner_email, siteSlug);
  const dash = `https://${site.domain}/directory/owner?t=${token}`;
  const page = `https://${site.domain}/directory/listing/${b.slug}`;
  const e = (x: string) => String(x).replace(/</g, "&lt;");
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to: b.owner_email,
    subject: `${b.name} is live on ${site.name}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:560px">
<p>Hi,</p>
<p><b>${e(b.name)}</b> is now listed in the ${e(site.state)} business directory on ${e(site.name)}: <a href="${page}">see your page</a>.</p>
<p>Your free business dashboard shows how many people view your page and call you, and whether they found you on Google, Bing or ChatGPT. You can also reply to reviews with one click.</p>
<p><a href="${dash}" style="display:inline-block;background:#111;color:#fff;padding:11px 20px;text-decoration:none;font-weight:bold;border-radius:6px">Open my dashboard</a></p>
<p><b>Free for you:</b></p>
<ul><li>A printable "Review us" QR sign for your counter</li><li>An AI assistant on your page that answers customers' questions</li><li>A badge for your website if you're in your town's top 10</li></ul>
<p><b>When you want more customers:</b></p>
<ul><li><b>Your own website on ${e(site.name)}</b>: we build a free preview in 30 seconds (services, prices, photos, contact form, AI assistant). $29/month only if you publish it.</li><li><b>Business Spotlight</b>: top of ${e(b.city)}'s list for 12 months plus a profile article, $49 once.</li><li><b>A deal or coupon</b> on your page and the ${e(site.state)} deals page, $19.</li></ul>
<p>The dashboard link works for 7 days; you can always get a new one at ${site.domain}/directory/owner.</p>
<p>${e(site.name)}</p></div>`,
  }).catch(() => null);
  return true;
}
