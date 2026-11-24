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
