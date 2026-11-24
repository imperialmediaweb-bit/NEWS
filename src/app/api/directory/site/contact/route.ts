import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { getBizSite, isLive, siteSchema } from "@/lib/business-site";
import { Resend } from "resend";

/** Contact / quote request from a Business Website: saved as a lead and emailed to the business. */
export const dynamic = "force-dynamic";
const recent = new Map<string, number[]>();
export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  if (b.website) return NextResponse.json({ ok: true });
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const now = Date.now(), arr = (recent.get(ip) || []).filter((t) => now - t < 3600000);
  if (arr.length >= 5) return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  arr.push(now); recent.set(ip, arr);
  const s = (k: string, n: number) => String(b[k] || "").trim().slice(0, n);
  const name = s("name", 100), email = s("email", 200), phone = s("phone", 40), message = s("message", 2000);
  if (!name || (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email) && phone.replace(/\D/g, "").length < 7) || message.length < 5) return NextResponse.json({ error: "Please add your name, an email or phone, and a message." }, { status: 400 });
  await siteSchema();
  const bs = await getBizSite(site.slug, s("slug", 200));
  if (!bs || !isLive(bs) || !bs.contact_email) return NextResponse.json({ error: "This business isn't taking messages here right now." }, { status: 400 });
  await pool.query(`INSERT INTO business_leads (business_id, name, email, phone, message) VALUES ($1,$2,$3,$4,$5)`, [bs.business_id, name, email || null, phone || null, message]);
  if (process.env.RESEND_API_KEY) {
    const e = (x: string) => x.replace(/</g, "&lt;");
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `${site.name} <contact@alabama-express.com>`, to: bs.contact_email, ...(email ? { replyTo: email } : {}),
      subject: `New message for ${bs.business.name} from your website`,
      html: `<p><b>${e(name)}</b>${email ? ` &lt;${e(email)}&gt;` : ""}${phone ? ` · ${e(phone)}` : ""} wrote via your page on ${site.name}:</p><blockquote>${e(message).replace(/\n/g, "<br>")}</blockquote><p>Reply to this email to answer them.</p>`,
    }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
