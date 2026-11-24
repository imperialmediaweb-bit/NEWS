import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { newOwnerToken, ownerBusinesses, ownerSchema } from "@/lib/directory-owner";
import { llmJson } from "@/lib/llm-json";
import { Resend } from "resend";

/**
 * Owner actions.
 *  action=login  {email}            → emails a sign-in link (always answers the same, so it can't be used to test emails)
 *  action=suggest {token, reviewId} → an AI draft reply to a review, polite and specific, nothing promised
 *  action=reply  {token, reviewId, reply} → publishes the owner's reply under the review
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  await ownerSchema();
  if (b.action === "login") {
    const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    const { rows } = await pool.query(`SELECT COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND lower(owner_email) = $2`, [site.slug, email]);
    if (rows[0].n > 0 && process.env.RESEND_API_KEY) {
      const token = await newOwnerToken(email, site.slug);
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `${site.name} <contact@alabama-express.com>`, to: email, subject: `Your ${site.name} business dashboard`,
        html: `<p>Hi,</p><p>Here is your link to your business dashboard on ${site.name}: page views, calls, where customers found you, reviews and replies.</p><p><a href="https://${site.domain}/directory/owner?t=${token}" style="background:#111;color:#fff;padding:10px 18px;text-decoration:none;font-weight:bold">Open my dashboard</a></p><p>The link works for 7 days. If you didn't ask for it, ignore this email.</p>`,
      }).catch(() => null);
    }
    return NextResponse.json({ ok: true });
  }
  const own = await ownerBusinesses(String(b.token || ""), site.slug);
  if (!own) return NextResponse.json({ error: "Your link has expired. Ask for a new one." }, { status: 401 });
  const ids = own.businesses.map((x: { id: number }) => x.id);
  const { rows: rv } = await pool.query(`SELECT r.*, b.name AS biz FROM business_reviews r JOIN businesses b ON b.id = r.business_id WHERE r.id = $1 AND r.business_id = ANY($2::int[]) AND r.verified AND NOT r.hidden`, [Number(b.reviewId), ids]);
  const review = rv[0];
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (b.action === "suggest") {
    const out = await llmJson<{ reply: string }>(`Write a short, warm, professional reply from the owner of "${review.biz}" to this customer review. Thank them by first name, respond to what they actually said, apologize sincerely if they were unhappy and invite them to get in touch, without promising refunds, discounts or anything specific. 2-4 sentences, American English, no emojis. Return JSON {"reply": "..."}.
REVIEW (${review.rating}/5 by ${review.name}): ${review.body}`, 400).catch(() => null);
    return out?.reply ? NextResponse.json({ reply: String(out.reply).slice(0, 1000) }) : NextResponse.json({ error: "The assistant is busy. Try again." }, { status: 503 });
  }
  if (b.action === "reply") {
    const reply = String(b.reply || "").trim().slice(0, 1000);
    if (reply.length < 5) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
    await pool.query(`UPDATE business_reviews SET owner_reply = $2 WHERE id = $1`, [review.id, reply]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
