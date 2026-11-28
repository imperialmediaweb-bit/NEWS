import pool from "@/lib/db";
import { applyClaim } from "@/lib/directory";
import { rejectSender } from "@/lib/reject-sender";

/**
 * Automatic review of free listings and claims, so the admin only sees the
 * doubtful ones:
 *  - the same business sent twice (same paper, name and phone, within 2 hours)
 *    keeps the first request; the repeats are rejected;
 *  - a NEW free listing is approved when its own website answers and shows the
 *    listing's phone number or name (the owner controls that website);
 *  - a CLAIM of a listing we already have is approved when the phone or the
 *    website domain matches what the listing already says.
 * Anything else waits up to 24 hours for a person; then a single listing with a
 * phone number goes live by itself. Bulk senders always wait for a person.
 */
const digits = (v: unknown) => String(v || "").replace(/\D/g, "").slice(-10);
const hostOf = (u: unknown) => { try { return new URL(String(u)).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

async function websiteConfirms(website: string, phone: string, name: string): Promise<boolean> {
  if (!website) return false;
  try {
    const r = await fetch(website, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ExpressDirectory/1.0)" }, signal: AbortSignal.timeout(10000), redirect: "follow" });
    if (!r.ok) return false;
    const html = (await r.text()).slice(0, 600_000);
    const page = html.replace(/\D/g, "");
    if (phone.length >= 10 && page.includes(phone.slice(-7))) return true;
    // the business name (its distinctive words) on its own site
    const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !["llc", "inc", "corp", "company", "services", "the"].includes(w));
    const text = html.toLowerCase();
    return words.length > 0 && words.every((w) => text.includes(w));
  } catch { return false; }
}

export async function autoReviewClaims(): Promise<{ approved: number; duplicates: number }> {
  const { rows } = await pool.query(`
    SELECT c.id, c.site_slug, c.data, c.created_at, c.name, c.ip_hash, b.status AS biz_status, b.phone AS cur_phone, b.website AS cur_website, b.id AS business_id
      FROM business_claims c JOIN businesses b ON b.id = c.business_id
     WHERE c.status = 'pending' AND c.order_id IS NULL
     ORDER BY c.id LIMIT 30`).catch(() => ({ rows: [] }));
  let approved = 0, duplicates = 0;
  for (const c of rows) {
    const d = c.data as Record<string, string>;
    const phone = digits(d.phone);
    // a repeat of an earlier request for the same business
    const { rows: dup } = await pool.query(`
      SELECT 1 FROM business_claims e WHERE e.id < $1 AND e.site_slug = $2 AND e.status IN ('pending', 'applied')
         AND lower(e.data->>'name') = lower($3) AND regexp_replace(coalesce(e.data->>'phone', ''), '\\D', '', 'g') LIKE '%' || $4
         AND e.created_at > $5::timestamptz - interval '2 hours' LIMIT 1`, [c.id, c.site_slug, d.name || "", phone || "§", c.created_at]);
    if (dup.length && phone) {
      await pool.query(`UPDATE business_claims SET status = 'rejected', reviewed_by = 'auto', reviewed_at = now() WHERE id = $1`, [c.id]);
      await pool.query(`UPDATE businesses SET status = 'hidden' WHERE id = $1 AND status = 'pending'`, [c.business_id]);
      duplicates++;
      continue;
    }
    // one person sending many listings (lead-gen networks) always goes to a person
    const { rows: bulk } = await pool.query(`SELECT COUNT(*)::int n FROM business_claims WHERE (lower(name) = lower($1) OR (ip_hash IS NOT NULL AND ip_hash = $3)) AND created_at > $2::timestamptz - interval '24 hours' AND created_at < $2::timestamptz + interval '24 hours'`, [c.name || "", c.created_at, c.ip_hash || null]);
    if ((bulk[0]?.n || 0) > 3) {
      // a lead-gen network: most of the sender's listings are "<City> <Service>" sites in different cities
      const { rows: theirs } = await pool.query(`SELECT data->>'name' AS name, data->>'city' AS city FROM business_claims WHERE lower(name) = lower($1) AND created_at > now() - interval '7 days'`, [c.name || ""]);
      const cityNamed = theirs.filter((t) => t.city && String(t.name || "").toLowerCase().includes(String(t.city).toLowerCase().split(",")[0].trim())).length;
      const cities = new Set(theirs.map((t) => String(t.city || "").toLowerCase())).size;
      if (theirs.length >= 4 && cities >= 3 && cityNamed / theirs.length >= 0.6) {
        await rejectSender(c.name, { notify: true }).catch(() => null);
        duplicates++;
      }
      continue; // otherwise a person decides
    }
    let ok = false;
    if (c.biz_status === "pending") ok = await websiteConfirms(d.website, phone, d.name || "");
    else ok = (!!phone && phone === digits(c.cur_phone)) || (!!hostOf(d.website) && hostOf(d.website) === hostOf(c.cur_website));
    // nobody decided within 24 hours: a single (non-bulk) listing with a phone number goes live anyway,
    // so the owner gets the service without waiting for a person (it was screened for banned topics at submit)
    if (!ok && phone.length >= 10 && Date.now() - new Date(c.created_at).getTime() > 24 * 3600_000) ok = true;
    if (ok && await applyClaim(c.id).catch(() => false)) {
      await pool.query(`UPDATE business_claims SET reviewed_by = 'auto', reviewed_at = now() WHERE id = $1`, [c.id]);
      approved++;
    }
  }
  return { approved, duplicates };
}
