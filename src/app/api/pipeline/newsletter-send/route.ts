import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { TZ } from "@/config/timezones";
import { ensureNewsletterTable, senderFor } from "@/lib/newsletter";
import { Resend } from "resend";

/**
 * The morning newsletter: at 7 am local time, each site's top stories of the
 * last 24 hours to its confirmed subscribers, once a day. Every email has a
 * one-click unsubscribe (List-Unsubscribe headers) and the publisher's postal
 * address, which CAN-SPAM requires: nothing is sent until
 * NEWSLETTER_POSTAL_ADDRESS is set on Railway.
 *   GET /api/pipeline/newsletter-send?key=CRON_SECRET[&force=site-slug]
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const postal = process.env.NEWSLETTER_POSTAL_ADDRESS;
  if (!postal) return NextResponse.json({ skipped: "NEWSLETTER_POSTAL_ADDRESS not set (required by CAN-SPAM)" });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  await ensureNewsletterTable();
  const force = req.nextUrl.searchParams.get("force");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const out: Record<string, unknown> = {};

  for (const site of Object.values(sites)) {
    if (force && site.slug !== force) continue;
    const hour = Number(new Date().toLocaleString("en-US", { timeZone: TZ[site.state] || "America/New_York", hour: "numeric", hourCycle: "h23" }));
    if (!force && hour !== 7) continue;
    const { rows: subs } = await pool.query(
      `SELECT id, email, token FROM newsletter_subscribers
        WHERE site_slug = $1 AND status = 'confirmed' AND (last_sent_at IS NULL OR last_sent_at < now() - interval '20 hours')`,
      [site.slug]
    );
    if (subs.length === 0) continue;
    const { rows: stories } = await pool.query(
      `SELECT a.title, a.slug, a.category, a.summary, a.featured_image
         FROM articles a JOIN sites s ON s.id = a.site_id
        WHERE s.slug = $1 AND a.published_at > now() - interval '24 hours'
        ORDER BY (a.category = 'local-news') DESC, a.published_at DESC LIMIT 8`,
      [site.slug]
    );
    if (stories.length < 3) { out[site.slug] = "under 3 stories, skipped"; continue; }
    const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: TZ[site.state] || "America/New_York" });
    const items = stories
      .map((a, i) => {
        const url = `https://${site.domain}/${(a.category || "local-news").toLowerCase().replace(/\s+/g, "-")}/${a.slug}?utm_source=newsletter&utm_medium=email`;
        const img = i === 0 && a.featured_image ? `<a href="${url}"><img src="${esc(a.featured_image)}" alt="" style="width:100%;max-width:560px;border-radius:4px"></a>` : "";
        return `${img}<h2 style="font-size:${i === 0 ? 22 : 17}px;margin:14px 0 4px"><a href="${url}" style="color:#111;text-decoration:none">${esc(a.title)}</a></h2>${a.summary ? `<p style="margin:0 0 10px;color:#444">${esc(a.summary)}</p>` : ""}`;
      })
      .join("");
    let sent = 0;
    for (let i = 0; i < subs.length; i += 100) {
      const batch = subs.slice(i, i + 100).map((s) => {
        const unsub = `https://${site.domain}/api/newsletter/unsubscribe?t=${s.token}`;
        return {
          from: senderFor(site),
          to: s.email as string,
          subject: `${site.name}: ${stories[0].title}`.slice(0, 150),
          headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          html: `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#111">
<p style="font-family:system-ui;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.08em">${esc(site.name)} · ${esc(date)}</p>${items}
<p style="font-family:system-ui;margin-top:24px"><a href="https://${site.domain}/?utm_source=newsletter">More ${esc(site.state)} news →</a></p>
<hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p style="font-family:system-ui;font-size:12px;color:#777">You get this because you subscribed at ${esc(site.domain)}. <a href="${unsub}">Unsubscribe</a> with one click.<br>${esc(site.name)} · ${esc(postal)}</p></div>`,
        };
      });
      const r = await resend.batch.send(batch);
      if (r.error) { out[site.slug] = `error: ${r.error.message}`; break; }
      sent += batch.length;
      await pool.query("UPDATE newsletter_subscribers SET last_sent_at = now() WHERE id = ANY($1::int[])", [subs.slice(i, i + 100).map((s) => s.id)]);
    }
    out[site.slug] = out[site.slug] || { sent, stories: stories.length };
  }
  return NextResponse.json({ ran: new Date().toISOString(), out });
}
