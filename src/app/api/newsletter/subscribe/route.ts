import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ensureNewsletterTable, newToken, senderFor, sendMail } from "@/lib/newsletter";

/** POST /api/newsletter/subscribe {email} — sends the confirmation link (double opt-in). */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
  if (body.website) return NextResponse.json({ ok: true }); // honeypot
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  await ensureNewsletterTable();
  const token = newToken();
  const { rows } = await pool.query(
    `INSERT INTO newsletter_subscribers (site_slug, email, token) VALUES ($1, $2, $3)
     ON CONFLICT (site_slug, email) DO UPDATE SET token = CASE WHEN newsletter_subscribers.status = 'confirmed' THEN newsletter_subscribers.token ELSE EXCLUDED.token END
     RETURNING status, token`,
    [site.slug, email, token]
  );
  if (rows[0].status === "confirmed") return NextResponse.json({ ok: true, already: true });
  const link = `https://${site.domain}/api/newsletter/confirm?t=${rows[0].token}`;
  try {
    await sendMail(
      email,
      `Confirm your ${site.name} morning newsletter`,
      `<p>Hi,</p><p>Please confirm you want the <b>${site.name}</b> morning newsletter: the day's top ${site.state} news, once a day.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Yes, subscribe me</a></p>
<p style="color:#666;font-size:13px">If you did not ask for this, ignore this email and you will not hear from us.</p>`,
      senderFor(site)
    );
  } catch (e) {
    console.error("[newsletter] confirm mail failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We could not send the confirmation email. Please try again later." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
