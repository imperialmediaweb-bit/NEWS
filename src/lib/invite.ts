import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { draftSite } from "@/lib/business-site";
import { optoutSig } from "@/lib/owner-drip";
import { previewSig } from "@/lib/invite-sig";
import { catBySlug } from "@/lib/directory-categories";
import type { Business } from "@/lib/directory";
import { Resend } from "resend";

/**
 * Invitations to businesses we imported (OpenStreetMap) and that nobody has
 * claimed: a few a day (INVITES_PER_DAY, default 5). We read the contact email
 * from the business's own website, build its website preview, and send ONE
 * email ("you're listed, here is your free website, claim it"), plus one
 * reminder 7 days later if it didn't claim. Never twice to the same business,
 * never after an unsubscribe, postal address and unsubscribe link in every
 * email (CAN-SPAM). Nothing is sent without NEWSLETTER_POSTAL_ADDRESS.
 */
const FIRST = ["plumbers", "electricians", "hvac", "roofers", "contractors", "landscapers", "locksmiths", "auto-repair", "tire-shops", "car-washes", "hair-salons", "barbers", "nail-salons", "beauty-spas", "dentists", "chiropractors", "physical-therapy", "gyms", "florists", "event-venues", "veterinarians", "insurance-agents", "real-estate-agents", "accountants", "lawyers"];

let ready: Promise<unknown> | null = null;
function schema() {
  ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS business_invites (
      business_id INT PRIMARY KEY, email TEXT, status VARCHAR(20) NOT NULL, sent_at TIMESTAMPTZ, reminded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS marketing_optout BOOLEAN NOT NULL DEFAULT FALSE;
  `).catch(() => { ready = null; });
  return ready;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JUNK = /(example\.|sentry|wixpress|godaddy|domain\.com|email\.com|yourdomain|\.png|\.jpg|\.jpeg|\.gif|\.webp|\.svg|noreply|no-reply|privacy|abuse|webmaster|postmaster)/i;

/** The business's contact email from its homepage or contact page (same domain first, then a free-mail address). */
async function findEmail(website: string): Promise<string | null> {
  let host = "";
  try { host = new URL(website).hostname.replace(/^www\./, ""); } catch { return null; }
  const found: string[] = [];
  for (const path of ["", "/contact", "/contact-us"]) {
    try {
      const r = await fetch(new URL(path || "/", website).toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; ExpressDirectory/1.0)" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
      if (!r.ok) continue;
      const html = (await r.text()).slice(0, 400_000).replace(/&#64;|\[at\]|\(at\)/gi, "@");
      for (const m of html.match(EMAIL_RE) || []) if (!JUNK.test(m)) found.push(m.toLowerCase().replace(/^mailto:/, ""));
    } catch { /* site down or slow */ }
    if (found.some((e) => e.endsWith("@" + host))) break;
  }
  return found.find((e) => e.endsWith("@" + host)) || found.find((e) => /@(gmail|yahoo|outlook|hotmail|aol|icloud)\.com$/.test(e)) || null;
}

export async function sendInvites(): Promise<{ sent: number; reminded: number }> {
  const postal = process.env.NEWSLETTER_POSTAL_ADDRESS;
  if (!postal || !process.env.RESEND_API_KEY) return { sent: 0, reminded: 0 };
  await schema();
  const perDay = Math.max(0, Number(process.env.INVITES_PER_DAY ?? 5));
  const { rows: c } = await pool.query(`SELECT COUNT(*)::int n FROM business_invites WHERE sent_at > now() - interval '24 hours' OR reminded_at > now() - interval '24 hours'`);
  let left = perDay - (c[0]?.n || 0);
  let sent = 0, reminded = 0;

  // reminders first (they count against the same daily limit)
  if (left > 0) {
    const { rows } = await pool.query(`
      SELECT i.business_id, i.email FROM business_invites i JOIN businesses b ON b.id = i.business_id
       WHERE i.status = 'sent' AND i.reminded_at IS NULL AND i.sent_at < now() - interval '7 days' AND NOT b.claimed AND NOT b.marketing_optout
       LIMIT $1`, [left]);
    for (const r of rows) {
      await pool.query(`UPDATE business_invites SET reminded_at = now() WHERE business_id = $1`, [r.business_id]);
      if (await sendOne(r.business_id, r.email, postal, true)) { reminded++; left--; }
    }
  }
  // new invitations: look at a few candidates per run, keep the ones with an email
  let tries = 0;
  while (left > 0 && tries < 4) {
    tries++;
    const { rows } = await pool.query(`
      SELECT b.id, b.website FROM businesses b
       WHERE b.status = 'active' AND NOT b.claimed AND b.owner_email IS NULL AND NOT b.marketing_optout AND b.website IS NOT NULL
         AND b.category = ANY($1::text[]) AND NOT EXISTS (SELECT 1 FROM business_invites i WHERE i.business_id = b.id)
       ORDER BY random() LIMIT 6`, [FIRST]);
    if (!rows.length) break;
    for (const b of rows) {
      if (left <= 0) break;
      const email = await findEmail(b.website);
      await pool.query(`INSERT INTO business_invites (business_id, email, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [b.id, email, email ? "pending" : "no_email"]);
      if (!email) continue;
      // nobody gets two invitations for two listings with the same address
      const { rows: dup } = await pool.query(`SELECT 1 FROM business_invites WHERE email = $1 AND business_id <> $2 AND status = 'sent'`, [email, b.id]);
      if (dup.length) { await pool.query(`UPDATE business_invites SET status = 'duplicate' WHERE business_id = $1`, [b.id]); continue; }
      if (await sendOne(b.id, email, postal, false)) {
        await pool.query(`UPDATE business_invites SET status = 'sent', sent_at = now() WHERE business_id = $1`, [b.id]);
        sent++; left--;
      } else await pool.query(`UPDATE business_invites SET status = 'failed' WHERE business_id = $1`, [b.id]);
    }
  }
  return { sent, reminded };
}

async function sendOne(businessId: number, email: string, postal: string, reminder: boolean): Promise<boolean> {
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE id = $1`, [businessId]);
  const b = rows[0] as Business | undefined;
  const site = b && sites[b.site_slug];
  if (!b || !site) return false;
  const web = await draftSite(b).catch(() => null);
  const e = (x: string) => x.replace(/[<>&"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[ch]!);
  const listing = `https://${site.domain}/directory/listing/${b.slug}`;
  const claim = `https://${site.domain}/directory/join?b=${b.slug}`;
  const preview = web ? `https://${site.domain}/b/${web.slug}?t=pv_${previewSig(b.id)}` : null;
  const unsub = `https://${site.domain}/api/directory/unsubscribe?b=${b.id}&s=${optoutSig(b.id)}`;
  const cat = catBySlug(b.category)?.one || "business";
  const btn = (href: string, label: string, bg: string) => `<a href="${href}" style="display:inline-block;background:${bg};color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;margin:4px 6px 4px 0">${label}</a>`;
  const subject = reminder ? `${b.name}: your free website on ${site.name} is still waiting` : `${b.name} is listed on ${site.name}. Your free website is ready`;
  const html = `<p>Hello ${e(b.name)} team,</p>
<p>${reminder ? `A week ago we let you know that` : `Good news:`} <b>${e(b.name)}</b> is listed in the ${site.name} local business directory as a ${e(cat)} in ${e(b.city)}: <a href="${listing}">see your listing</a>.</p>
${preview ? `<p>We also built a website for you, free to look at: <a href="${preview}"><b>see your website</b></a>. Services, photos, hours, a call or booking button, and a contact form that sends customers' messages to you.</p>` : ""}
<p><b>Claim your listing for free</b> to add photos, hours and a description. It takes two minutes.</p>
<p>${btn(claim, "Claim my listing for free", "#111")}${preview ? btn(preview, "See my website", "#c1121f") : ""}</p>
<p>Want more customers? Publish your website for <b>$9 the first month</b> (then $29/month) and get an article about ${e(b.name)} in ${site.name} every month.</p>
<p>${site.name}</p>
<p style="margin-top:28px;font-size:12px;color:#666">${site.name} · ${e(postal)}<br>You get this because ${e(b.name)} appears in public business listings and in our directory. We found this address on your website. ${reminder ? "This is our last email." : "We'll send one reminder at most."} <a href="${unsub}">Unsubscribe</a></p>`;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to: email, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
    subject: subject.slice(0, 180), html, headers: { "List-Unsubscribe": `<${unsub}>` },
  });
  if (error) console.error("[invite]", businessId, error.message);
  return !error;
}
