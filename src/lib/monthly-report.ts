import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { Resend } from "resend";

/**
 * Monthly report for Business Website subscribers: last month's real visits to
 * their directory listing and website (automated browsers left out), messages
 * from the contact form, new reviews and the articles published. Sent once per
 * business per month, in the first days of the month.
 */
let ready: Promise<unknown> | null = null;
function schema() {
  ready ??= pool.query(`CREATE TABLE IF NOT EXISTS business_reports (business_id INT NOT NULL, month DATE NOT NULL, sent_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (business_id, month))`).catch(() => { ready = null; });
  return ready;
}

type Row = { business_id: number; name: string; slug: string; site_slug: string; owner_email: string | null; contact_email: string | null; web_slug: string; level: string };

export async function sendMonthlyReports(limit = 25): Promise<number> {
  await schema();
  const { rows } = await pool.query<Row>(`
    SELECT s.business_id, b.name, b.slug, b.site_slug, b.owner_email, s.contact_email, s.slug AS web_slug, s.level
      FROM business_sites s JOIN businesses b ON b.id = s.business_id
     WHERE s.status = 'active' AND s.created_at < date_trunc('month', now())
       AND NOT EXISTS (SELECT 1 FROM business_reports r WHERE r.business_id = s.business_id AND r.month = (date_trunc('month', now()) - interval '1 month')::date)
     LIMIT $1`, [limit]).catch(() => ({ rows: [] as Row[] }));
  let n = 0;
  for (const b of rows) if (await sendOne(b).catch((e) => { console.error("[monthly-report]", b.business_id, (e as Error).message); return false; })) n++;
  return n;
}

async function sendOne(b: Row): Promise<boolean> {
  const site = sites[b.site_slug];
  const to = b.owner_email || b.contact_email;
  // claim the month first, so a slow send can't go out twice
  const { rowCount } = await pool.query(`INSERT INTO business_reports (business_id, month) VALUES ($1, (date_trunc('month', now()) - interval '1 month')::date) ON CONFLICT DO NOTHING`, [b.business_id]);
  if (!rowCount || !site || !to || !process.env.RESEND_API_KEY) return false;

  const range = `pv.created_at >= date_trunc('month', now()) - interval '1 month' AND pv.created_at < date_trunc('month', now())`;
  const [{ rows: v }, { rows: l }, { rows: r }, { rows: a }] = await Promise.all([
    pool.query(`SELECT COUNT(*) FILTER (WHERE pv.path = $2)::int AS listing, COUNT(*) FILTER (WHERE pv.path = $3 OR pv.path LIKE $3 || '/%')::int AS website
                  FROM page_views pv JOIN sites st ON st.id = pv.site_id
                 WHERE st.slug = $1 AND ${range} AND NOT COALESCE(pv.is_bot, FALSE)`, [b.site_slug, `/directory/listing/${b.slug}`, `/b/${b.web_slug}`]).catch(() => ({ rows: [{ listing: 0, website: 0 }] })),
    pool.query(`SELECT COUNT(*)::int n FROM business_leads WHERE business_id = $1 AND created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now())`, [b.business_id]).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT COUNT(*)::int n FROM business_reviews WHERE business_id = $1 AND verified AND NOT hidden AND created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now())`, [b.business_id]).catch(() => ({ rows: [{ n: 0 }] })),
    pool.query(`SELECT title, article_slug FROM paid_orders WHERE business_id = $1 AND status = 'published' AND published_at >= date_trunc('month', now()) - interval '1 month' AND published_at < date_trunc('month', now())`, [b.business_id]).catch(() => ({ rows: [] })),
  ]);
  const month = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const e = (x: string) => x.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
  const row = (k: string, val: number | string) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;font-size:18px">${val}</td></tr>`;
  const articles = a.map((x) => `<li><a href="https://${site.domain}/${e(x.article_slug || "")}">${e(x.title)}</a></li>`).join("");
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
    subject: `${b.name}: your ${month} report on ${site.name}`.slice(0, 180),
    html: `<p>Hello,</p><p>Here is how <b>${e(b.name)}</b> did on ${site.name} in ${month}.</p>
<table style="border-collapse:collapse;min-width:300px">${row("Visits to your listing", v[0]?.listing ?? 0)}${row("Visits to your website", v[0]?.website ?? 0)}${row("Messages from customers", l[0]?.n ?? 0)}${row("New reviews", r[0]?.n ?? 0)}</table>
${articles ? `<p><b>Published about you:</b></p><ul>${articles}</ul>` : ""}
<p>Visits count real people only; automated traffic is left out.</p>
<p><a href="https://${site.domain}/b/${e(b.web_slug)}">See your website</a> · <a href="https://${site.domain}/directory/listing/${e(b.slug)}">See your listing</a></p>
${b.level !== "premium" ? `<p>Want to be first in your city's list? Premium keeps you at the top while you're subscribed. Reply to this email and we'll switch you.</p>` : ""}
<p>${site.name}</p>`,
  }).catch(() => null);
  return true;
}
