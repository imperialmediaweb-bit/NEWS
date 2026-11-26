import crypto from "crypto";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { llmJson } from "@/lib/llm-json";
import { catBySlug } from "@/lib/directory-categories";
import { Resend } from "resend";

/**
 * The monthly article included with a Business Website subscription (Standard
 * and Premium). Once a month the AI writes a useful local piece in the
 * business's field and season, with the business as the local example, using
 * only facts the business gave us. The owner gets it by email and can publish
 * it now, skip the month, or reply with changes; if they do nothing it goes
 * live 3 days later. It is stored as a paid order (product "monthly_article"),
 * so it publishes through the same code as Business Spotlight: labelled as
 * sponsored, the business link rel="sponsored".
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Row = {
  business_id: number; name: string; category: string; city: string; site_slug: string; slug: string; description: string | null;
  website: string | null; phone: string | null; owner_email: string | null; photo_url: string | null;
  tagline: string | null; about: string | null; services: { name?: string; price?: string; description?: string }[] | null; contact_email: string | null;
};

let ready: Promise<unknown> | null = null;
function schema() {
  ready ??= pool.query(`ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS owner_token TEXT`).catch(() => { ready = null; });
  return ready;
}

/** Write this month's article for every live website that doesn't have one yet (a few per run). */
export async function writeMonthlyArticles(limit = 8): Promise<number> {
  await schema();
  const { rows } = await pool.query<Row>(`
    SELECT s.business_id, b.name, b.category, b.city, b.site_slug, b.slug, b.description, b.website, b.phone, b.owner_email, b.photo_url,
           s.tagline, s.about, s.services, s.contact_email
      FROM business_sites s JOIN businesses b ON b.id = s.business_id
     WHERE s.status = 'active'
       AND NOT EXISTS (SELECT 1 FROM paid_orders o WHERE o.business_id = s.business_id AND o.product = 'monthly_article'
                        AND o.created_at >= date_trunc('month', now()))
     LIMIT $1`, [limit]).catch(() => ({ rows: [] as Row[] }));
  let n = 0;
  for (const b of rows) if (await writeOne(b).catch((e) => { console.error("[monthly-article]", b.business_id, (e as Error).message); return false; })) n++;
  return n;
}

async function writeOne(b: Row): Promise<boolean> {
  const site = sites[b.site_slug];
  if (!site) return false;
  const now = new Date();
  const month = MONTHS[now.getUTCMonth()];
  const cat = catBySlug(b.category)?.name || b.category;
  const { rows: past } = await pool.query(`SELECT title FROM paid_orders WHERE business_id = $1 AND product IN ('monthly_article', 'spotlight', 'spotlight_home') ORDER BY created_at DESC LIMIT 12`, [b.business_id]);
  const services = (b.services || []).map((s) => [s.name, s.price, s.description].filter(Boolean).join(" · ")).filter(Boolean).slice(0, 12);
  const facts = [
    `Business: ${b.name}`, `Field: ${cat}`, `City: ${b.city}, ${site.state}`,
    b.tagline && `Tagline: ${b.tagline}`, b.description && `Description: ${b.description}`, b.about && `About: ${b.about}`,
    services.length && `Services: ${services.join("; ")}`, b.website && `Website: ${b.website}`, b.phone && `Phone: ${b.phone}`,
  ].filter(Boolean).join("\n");

  const out = await llmJson<{ title?: string; body?: string }>(`You write a short, genuinely useful local article for ${site.name}, a ${site.state} news site. It is sponsored by the business below and will be labelled as sponsored.
Month: ${month} ${now.getUTCFullYear()}. Pick ONE practical topic that people in ${b.city} care about this month in this field (seasonal needs, weather, holidays, local events in general terms, common mistakes, how to choose a provider). The business appears as the local example near the end, in one or two short paragraphs.
FACTS (the only things you may say about the business):
${facts}
Do NOT repeat these earlier titles or their topics: ${past.map((p) => p.title).join(" | ") || "none"}.
RULES: 350-500 words, plain paragraphs separated by a blank line, no headings, no lists, no quotes from people, no invented facts, prices, awards, years, staff, statistics or claims about the business, no "best"/"#1" claims, no exclamation marks. General advice must be true and safe. American English.
Return JSON: {"title": "headline under 90 characters", "body": "the article"}`, 2200);
  const title = String(out?.title || "").trim().slice(0, 140), body = String(out?.body || "").trim().slice(0, 6000);
  if (title.length < 10 || body.length < 600) return false;

  const token = crypto.randomBytes(18).toString("hex");
  const { rows } = await pool.query(
    `INSERT INTO paid_orders (site_slug, product, title, body, business, website, name, email, photo_url, cents, city, phone, business_id, status, auto_publish_at, owner_token)
     VALUES ($1,'monthly_article',$2,$3,$4,$5,$4,$6,$7,0,$8,$9,$10,'paid', now() + interval '3 days', $11) RETURNING id`,
    [b.site_slug, title, body, b.name, b.website, b.owner_email || b.contact_email || "", b.photo_url, b.city, b.phone, b.business_id, token]);
  const to = b.owner_email || b.contact_email;
  if (to && process.env.RESEND_API_KEY) {
    const base = `https://${site.domain}/api/directory/monthly?id=${rows[0].id}&t=${token}`;
    const preview = body.split(/\n\s*\n/).slice(0, 2).map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("");
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `${site.name} <contact@alabama-express.com>`, to, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
      subject: `Your ${month} article on ${site.name}: ${title}`.slice(0, 180),
      html: `<p>Hello,</p><p>Here is this month's article about <b>${b.name.replace(/</g, "&lt;")}</b>, included with your website. It goes live on ${site.name} in 3 days, labelled as sponsored, unless you tell us otherwise.</p>
<h3>${title.replace(/</g, "&lt;")}</h3>${preview}<p>…</p>
<p><a href="${base}&a=publish" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Publish it now</a>
&nbsp; <a href="${base}&a=skip">Skip this month</a></p>
<p>Want something changed? Just reply to this email with what to change.</p><p>${site.name}</p>`,
    }).catch(() => null);
  }
  return true;
}
