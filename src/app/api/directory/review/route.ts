import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, dirSchema } from "@/lib/directory";
import { Resend } from "resend";

/** A reader's review: stored unverified, published when the emailed link is clicked. */
export const dynamic = "force-dynamic";
const recent = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const b = await req.json().catch(() => ({})) as Record<string, string | number>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const now = Date.now(), arr = (recent.get(ip) || []).filter((t) => now - t < 3600000);
  if (arr.length >= 6) return NextResponse.json({ error: "Too many reviews from here. Try again later." }, { status: 429 });
  arr.push(now); recent.set(ip, arr);
  const rating = Number(b.rating), body = String(b.body || "").trim().slice(0, 2000), name = String(b.name || "").trim().slice(0, 60), email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!(rating >= 1 && rating <= 5) || body.length < 20 || !name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please choose stars, write at least a sentence, and give your name and email." }, { status: 400 });
  if (/https?:\/\/|www\./i.test(body)) return NextResponse.json({ error: "Please leave links out of the review." }, { status: 400 });
  const biz = await getBusiness(site.slug, String(b.slug || ""));
  if (!biz) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  await dirSchema();
  const token = crypto.randomBytes(24).toString("hex");
  const ipHash = crypto.createHash("sha256").update(`rev:${ip}`).digest("hex").slice(0, 32);
  const { rows } = await pool.query(
    `INSERT INTO business_reviews (business_id, rating, body, name, email, token, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (business_id, email) DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, name = EXCLUDED.name, token = EXCLUDED.token
       WHERE NOT business_reviews.verified
     RETURNING id`,
    [biz.id, Math.round(rating), body, name, email, token, ipHash]
  );
  if (!rows[0]) return NextResponse.json({ error: "You have already reviewed this business." }, { status: 409 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Reviews are not available right now." }, { status: 503 });
  const link = `https://${site.domain}/api/directory/review/confirm?t=${token}`;
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: `${site.name} <contact@alabama-express.com>`, to: email,
    subject: `Confirm your review of ${biz.name}`.slice(0, 150),
    html: `<p>Hi ${name.replace(/</g, "")},</p><p>Thanks for reviewing <b>${biz.name.replace(/</g, "")}</b> on ${site.name}. Click below to publish it:</p><p><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;text-decoration:none;font-weight:bold">Publish my review</a></p><p>If you didn't write this review, ignore this email and nothing will be published.</p>`,
  }).catch(() => null);
  return NextResponse.json({ ok: true });
}
