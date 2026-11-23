import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, dirSchema } from "@/lib/directory";
import { Resend } from "resend";

/** "Remove this listing": the request is saved and the newsroom is emailed; removal is one click in /admin/directory. */
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const b = await req.json().catch(() => ({})) as Record<string, string>;
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const name = String(b.name || "").trim().slice(0, 120), email = String(b.email || "").trim().slice(0, 200), reason = String(b.reason || "").trim().slice(0, 1000);
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and email." }, { status: 400 });
  const biz = await getBusiness(site.slug, String(b.slug || ""));
  if (!biz) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  await dirSchema();
  await pool.query(`INSERT INTO business_removals (business_id, name, email, reason) VALUES ($1,$2,$3,$4)`, [biz.id, name, email, reason || null]);
  if (process.env.RESEND_API_KEY) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `${site.name} <contact@alabama-express.com>`, to: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
      subject: `[Directory] Removal request: ${biz.name} (${biz.city})`.slice(0, 180),
      html: `<p>${name.replace(/</g, "")} &lt;${email.replace(/</g, "")}&gt; asks to remove <b>${biz.name.replace(/</g, "")}</b> (${biz.city}) from ${site.name}.</p><p>Reason: ${(reason || "none given").replace(/</g, "")}</p><p><a href="https://${site.domain}/admin/directory">Remove it in one click</a></p>`,
    }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
