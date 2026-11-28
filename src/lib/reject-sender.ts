import pool from "@/lib/db";
import { dirSchema } from "@/lib/directory";

/**
 * Reject every free listing/claim from one sender (lead-gen networks): claims
 * rejected, listings they created hidden, claimed imports go back to
 * unclaimed. Optionally keeps their first listing and emails them once that
 * more listings go through Business Spotlight (paid, labelled as sponsored).
 */
export async function rejectSender(name: string, opts: { keepFirst?: boolean; notify?: boolean } = {}) {
  await dirSchema();
  const { rows: first } = await pool.query(`SELECT id FROM business_claims WHERE lower(name) = lower($1) AND order_id IS NULL ORDER BY created_at LIMIT 1`, [name]);
  const keepId = opts.keepFirst ? first[0]?.id ?? 0 : 0;
  const { rows } = await pool.query(
    `UPDATE business_claims SET status = 'rejected', reviewed_by = 'auto', reviewed_at = now() WHERE lower(name) = lower($1) AND order_id IS NULL AND id <> $2 AND status <> 'rejected' RETURNING business_id, email, site_slug`, [name, keepId]);
  const ids = rows.map((r) => r.business_id);
  const { rowCount: hidden } = await pool.query(`UPDATE businesses SET status = 'hidden', updated_at = now() WHERE id = ANY($1::int[]) AND source = 'owner'`, [ids]);
  const { rowCount: unclaimed } = await pool.query(`UPDATE businesses SET claimed = FALSE, owner_email = NULL, updated_at = now() WHERE id = ANY($1::int[]) AND source <> 'owner'`, [ids]);
  await pool.query(`UPDATE business_sites SET status = 'canceled' WHERE business_id = ANY($1::int[]) AND status = 'draft'`, [ids]).catch(() => null);
  let notified = false;
  if (opts.notify && rows.length && process.env.RESEND_API_KEY) {
    // one email per sender, ever
    await pool.query(`CREATE TABLE IF NOT EXISTS bulk_notices (sender TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    const { rowCount } = await pool.query(`INSERT INTO bulk_notices (sender) VALUES (lower($1)) ON CONFLICT DO NOTHING`, [name]);
    if (rowCount) {
      const { sites } = await import("@/config/sites");
      const { Resend } = await import("resend");
      const site = sites[rows[0].site_slug];
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `${site?.name || "Express"} Directory <contact@alabama-express.com>`, to: rows[0].email, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
        subject: "About your directory listings",
        html: `<p>Hello,</p><p>Thanks for submitting your businesses to our state business directories. Each owner gets <b>one free listing</b>${keepId ? ", and we kept your first one for review" : ""}; the other ${rows.length} submissions were not published.</p>
<p>More businesses or locations can be listed with <b>Business Spotlight</b> ($49 each, one-time): top of the city list for 12 months plus a profile article, clearly labelled as sponsored. Choose Spotlight on the "Add your business" page of the newspaper for that state.</p>
<p>For many listings across states, reply to this email and we'll send you a bulk price.</p><p>Directory team</p>`,
      }).catch(() => ({ error: true }));
      notified = !error;
    }
  }
  return { rejected: rows.length, hidden, unclaimed, kept: keepId || null, notified };
}
