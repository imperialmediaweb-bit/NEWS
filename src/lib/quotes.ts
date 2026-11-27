import crypto from "crypto";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { catBySlug } from "@/lib/directory-categories";
import { Resend } from "resend";

/**
 * "Get quotes": a customer describes the job; up to 3 local businesses in that
 * category get it by email. Businesses with a website subscription get the
 * customer's contact details at once; other owners who claimed their listing
 * get the job description and can unlock the contact for PRICE_LEAD_CENTS
 * ($15). Businesses we can't email (unclaimed) are shown to the customer with
 * their phone numbers instead.
 */
export const LEAD_CENTS = Number(process.env.PRICE_LEAD_CENTS || 1500);

let ready: Promise<unknown> | null = null;
export function quoteSchema() {
  ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS quote_requests (
      id SERIAL PRIMARY KEY, site_slug VARCHAR(100) NOT NULL, city_slug TEXT NOT NULL, city TEXT NOT NULL, category VARCHAR(60) NOT NULL,
      name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, zip TEXT, details TEXT NOT NULL, ip_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS quote_sends (
      quote_id INT NOT NULL, business_id INT NOT NULL, mode VARCHAR(10) NOT NULL, token TEXT NOT NULL, unlocked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (quote_id, business_id)
    );
  `).catch(() => { ready = null; });
  return ready;
}

type Pro = { id: number; name: string; phone: string | null; slug: string; owner_email: string | null; subscriber: boolean };
const e = (x: unknown) => String(x ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

export async function createQuote(q: { site: string; city_slug: string; city: string; category: string; name: string; email: string; phone: string; zip: string; details: string; ipHash: string }) {
  await quoteSchema();
  const site = sites[q.site];
  const { rows } = await pool.query(`INSERT INTO quote_requests (site_slug, city_slug, city, category, name, email, phone, zip, details, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [q.site, q.city_slug, q.city, q.category, q.name, q.email, q.phone || null, q.zip || null, q.details, q.ipHash]);
  const quoteId = rows[0].id as number;
  // reachable owners first: subscribers, then claimed listings; best rated first
  const { rows: pros } = await pool.query<Pro>(`
    SELECT b.id, b.name, b.phone, b.slug, b.owner_email,
           EXISTS (SELECT 1 FROM business_sites s WHERE s.business_id = b.id AND s.status = 'active') AS subscriber
      FROM businesses b
     WHERE b.site_slug = $1 AND b.city_slug = $2 AND b.category = $3 AND b.status = 'active'
     ORDER BY (b.owner_email IS NOT NULL) DESC, subscriber DESC, (b.tier <> 'free') DESC, b.rating_count > 0 DESC,
              (b.rating_sum::float / NULLIF(b.rating_count, 0)) DESC NULLS LAST, (b.phone IS NOT NULL) DESC, b.name
     LIMIT 6`, [q.site, q.city_slug, q.category]).catch(() => ({ rows: [] as Pro[] }));
  const reachable = pros.filter((p) => p.owner_email).slice(0, 3);
  const cat = catBySlug(q.category);
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  for (const p of reachable) {
    const mode = p.subscriber ? "full" : "teaser";
    const token = crypto.randomBytes(16).toString("hex");
    await pool.query(`INSERT INTO quote_sends (quote_id, business_id, mode, token, unlocked_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [quoteId, p.id, mode, token, mode === "full" ? new Date() : null]);
    if (!resend || !site) continue;
    const job = `<blockquote style="border-left:4px solid #ddd;margin:12px 0;padding:8px 14px;color:#333">${e(q.details).replace(/\n/g, "<br>")}</blockquote><p>Location: ${e(q.city)}${q.zip ? `, ${e(q.zip)}` : ""}</p>`;
    const html = mode === "full"
      ? `<p>Hello ${e(p.name)},</p><p>A customer in ${e(q.city)} asked ${site.name} for quotes from local ${e(cat?.name.toLowerCase() || "businesses")}:</p>${job}
<p><b>Contact:</b> ${e(q.name)} · <a href="mailto:${e(q.email)}">${e(q.email)}</a>${q.phone ? ` · ${e(q.phone)}` : ""}</p><p>Included with your website subscription. Reply quickly: customers usually pick one of the first to answer.</p><p>${site.name}</p>`
      : `<p>Hello ${e(p.name)},</p><p>A customer in ${e(q.city)} is looking for a ${e(cat?.one || "business")} and asked ${site.name} for quotes. Here is the job:</p>${job}
<p>The request went to up to 3 local businesses.</p>
<p><a href="https://${site.domain}/api/directory/quote/unlock?q=${quoteId}&b=${p.id}&t=${token}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Get the customer's contact: $${(LEAD_CENTS / 100).toFixed(0)}</a></p>
<p>Get every request free: publish your business website ($9 the first month) and customer requests are included.</p><p>${site.name}</p>`;
    await resend.emails.send({ from: `${site.name} <contact@alabama-express.com>`, to: p.owner_email!, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com", subject: `New customer request: ${cat?.one || "job"} in ${q.city}`.slice(0, 180), html }).catch(() => null);
  }

  // the customer: confirmation, plus phone numbers to call right away
  const callList = pros.filter((p) => p.phone).slice(0, 3);
  if (resend && site) {
    await resend.emails.send({
      from: `${site.name} <contact@alabama-express.com>`, to: q.email, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
      subject: `Your request for ${cat?.name.toLowerCase() || "quotes"} in ${q.city}`,
      html: `<p>Hi ${e(q.name)},</p><p>Thanks. ${reachable.length ? `We sent your request to ${reachable.length} local ${reachable.length === 1 ? "business" : "businesses"}; they'll contact you directly.` : "We'll pass your request on to local businesses as they join."}</p>
${callList.length ? `<p>Want to call now? These ${e(cat?.name.toLowerCase() || "businesses")} are listed in ${e(q.city)}:</p><ul>${callList.map((p) => `<li><a href="https://${site.domain}/directory/listing/${e(p.slug)}">${e(p.name)}</a>${p.phone ? ` · ${e(p.phone)}` : ""}</li>`).join("")}</ul>` : ""}
<p>${site.name}</p>`,
    }).catch(() => null);
    await resend.emails.send({ from: `${site.name} <contact@alabama-express.com>`, to: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com", subject: `[Quotes] ${cat?.one || q.category} in ${q.city}: sent to ${reachable.length}`, html: `<p>${e(q.details)}</p><p>${e(q.name)} &lt;${e(q.email)}&gt; ${e(q.phone)}</p><p>Sent to: ${reachable.map((p) => `${e(p.name)} (${p.subscriber ? "full" : "teaser"})`).join(", ") || "nobody reachable yet"}</p>` }).catch(() => null);
  }
  return { sent: reachable.length, call: callList.map((p) => ({ name: p.name, phone: p.phone, slug: p.slug })) };
}

/** After the unlock payment: the business gets the customer's contact. */
export async function unlockLead(quoteId: number, businessId: number) {
  await quoteSchema();
  const { rows } = await pool.query(`UPDATE quote_sends SET unlocked_at = now() WHERE quote_id = $1 AND business_id = $2 AND unlocked_at IS NULL RETURNING quote_id`, [quoteId, businessId]);
  if (!rows.length || !process.env.RESEND_API_KEY) return;
  const { rows: q } = await pool.query(`SELECT * FROM quote_requests WHERE id = $1`, [quoteId]);
  const { rows: b } = await pool.query(`SELECT name, owner_email, site_slug FROM businesses WHERE id = $1`, [businessId]);
  const site = b[0] && sites[b[0].site_slug];
  if (!q[0] || !b[0]?.owner_email || !site) return;
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to: b[0].owner_email, subject: `Customer contact: ${q[0].city}`,
    html: `<p>Hello ${e(b[0].name)},</p><p>Here is the customer who asked for quotes:</p><p><b>${e(q[0].name)}</b> · <a href="mailto:${e(q[0].email)}">${e(q[0].email)}</a>${q[0].phone ? ` · ${e(q[0].phone)}` : ""}</p><blockquote style="border-left:4px solid #ddd;margin:12px 0;padding:8px 14px">${e(q[0].details)}</blockquote><p>Good luck!<br>${site.name}</p>`,
  }).catch(() => null);
}
