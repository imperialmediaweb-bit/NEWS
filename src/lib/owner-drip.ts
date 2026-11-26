import crypto from "crypto";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { newOwnerToken } from "@/lib/directory-owner";
import { catBySlug } from "@/lib/directory-categories";
import { Resend } from "resend";

/**
 * Follow-up emails for owners who listed or claimed their business for free:
 * day 3 (your website is ready), day 7 (a monthly article about you), day 10
 * (Premium: first in your city), day 14 (last reminder). They stop as soon as
 * the business has a paid website, and never go to anyone who unsubscribed.
 * Marketing email under CAN-SPAM: needs NEWSLETTER_POSTAL_ADDRESS (a real
 * postal address in the footer); without it nothing is sent.
 */
const STEPS = [3, 7, 10, 14] as const;

let ready: Promise<unknown> | null = null;
function schema() {
  ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS owner_drip (business_id INT NOT NULL, step INT NOT NULL, sent_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (business_id, step));
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_optout BOOLEAN NOT NULL DEFAULT FALSE;
  `).catch(() => { ready = null; });
  return ready;
}

/** Unsubscribe links are signed, so nobody can opt someone else out by guessing ids. */
export function optoutSig(businessId: number): string {
  return crypto.createHmac("sha256", process.env.CRON_SECRET || "x").update(`optout:${businessId}`).digest("hex").slice(0, 24);
}

type Row = { id: number; name: string; city: string; city_slug: string; category: string; site_slug: string; owner_email: string; since: string; days: number };

export async function sendOwnerDrip(limit = 40): Promise<number> {
  const postal = process.env.NEWSLETTER_POSTAL_ADDRESS;
  if (!postal || !process.env.RESEND_API_KEY) return 0;
  await schema();
  // owners whose claim or free listing was approved, no paid website, not unsubscribed
  const { rows } = await pool.query<Row>(`
    SELECT b.id, b.name, b.city, b.city_slug, b.category, b.site_slug, b.owner_email, MIN(c.created_at) AS since,
           EXTRACT(DAY FROM now() - MIN(c.created_at))::int AS days
      FROM businesses b JOIN business_claims c ON c.business_id = b.id AND c.status = 'applied'
     WHERE b.claimed AND b.owner_email IS NOT NULL AND NOT b.marketing_optout
       AND NOT EXISTS (SELECT 1 FROM business_sites s WHERE s.business_id = b.id AND s.status IN ('active', 'past_due'))
     GROUP BY b.id
    HAVING now() - MIN(c.created_at) BETWEEN interval '3 days' AND interval '20 days'
     LIMIT $1`, [limit]).catch(() => ({ rows: [] as Row[] }));
  let n = 0;
  for (const b of rows) {
    const step = [...STEPS].reverse().find((d) => b.days >= d);
    if (!step) continue;
    // one email per run, the latest step due, and never the same step twice
    const { rowCount } = await pool.query(`INSERT INTO owner_drip (business_id, step) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [b.id, step]);
    if (!rowCount) continue;
    // skip older steps that weren't sent (e.g. after a pause): mark them done
    await pool.query(`INSERT INTO owner_drip (business_id, step) SELECT $1, s FROM unnest($2::int[]) s ON CONFLICT DO NOTHING`, [b.id, STEPS.filter((d) => d < step)]);
    if (await sendStep(b, step, postal).catch(() => false)) n++;
  }
  return n;
}

async function sendStep(b: Row, step: number, postal: string): Promise<boolean> {
  const site = sites[b.site_slug];
  if (!site) return false;
  const e = (x: string) => x.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
  const dash = `https://${site.domain}/directory/owner?t=${await newOwnerToken(b.owner_email, b.site_slug)}`;
  const unsub = `https://${site.domain}/api/directory/unsubscribe?b=${b.id}&s=${optoutSig(b.id)}`;
  const btn = (label: string) => `<p style="margin:22px 0"><a href="${dash}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${label}</a></p>`;
  const cat = catBySlug(b.category)?.name || "businesses";
  let subject = "", body = "";
  if (step === 3) {
    subject = `Your ${site.name} website is ready. Publish it?`;
    body = `<p>Hello,</p><p>We built a website for <b>${e(b.name)}</b>: your services, photos, hours, a call or booking button, and a contact form that sends customers' messages straight to you. Our AI assistant changes anything you ask, in plain words.</p>${btn("See and publish my website")}<p>The first month is <b>$9</b>, then $29/month, or $249/year (3 months free). Cancel any time.</p>`;
  } else if (step === 7) {
    subject = `An article about ${b.name} in ${site.name}, every month`;
    body = `<p>Hello,</p><p>With your website you also get <b>one article a month about ${e(b.name)}</b> in ${site.name}: a useful local piece for this season in your field, with your business as the local example. You see it before it goes live, and it's labelled as sponsored.</p>${btn("Start for $9")}<p>Then $29/month or $249/year. Cancel any time.</p>`;
  } else if (step === 10) {
    const { rows } = await pool.query(`SELECT COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND city_slug = $2 AND category = $3 AND status = 'active'`, [b.site_slug, b.city_slug, b.category]).catch(() => ({ rows: [{ n: 0 }] }));
    const n = rows[0]?.n || 0;
    subject = `Be first among ${cat.toLowerCase()} in ${b.city}`;
    body = `<p>Hello,</p><p>${n > 1 ? `There are <b>${n}</b> ${e(cat.toLowerCase())} listed in ${e(b.city)} on ${site.name}.` : `Customers in ${e(b.city)} look for ${e(cat.toLowerCase())} on ${site.name}.`} With <b>Premium</b>, ${e(b.name)} stays first in that list for as long as you're subscribed, with your website and the monthly article included.</p>${btn("See Premium")}<p>$9 the first month, then $59/month, or $549/year.</p>`;
  } else {
    subject = `Last reminder: ${b.name}'s website for $9`;
    body = `<p>Hello,</p><p>Your website for <b>${e(b.name)}</b> is still waiting as a private preview. This is our last reminder: publish it for <b>$9</b> the first month and get your monthly article in ${site.name}.</p>${btn("Publish my website")}<p>Not interested? No problem, your free listing stays as it is.</p>`;
  }
  const footer = `<p style="margin-top:28px;font-size:12px;color:#666">${site.name} · ${e(postal)}<br>You get this because you listed ${e(b.name)} in the ${site.name} business directory. <a href="${unsub}">Unsubscribe</a></p>`;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to: b.owner_email, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
    subject: subject.slice(0, 180), html: body + `<p>${site.name}</p>` + footer,
    headers: { "List-Unsubscribe": `<${unsub}>` },
  });
  return !error;
}
