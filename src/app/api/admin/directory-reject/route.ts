import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { dirSchema } from "@/lib/directory";

/**
 * Reject every listing/claim sent by one submitter (bulk lead-gen sites):
 * GET ?name=Full Name  (exact submitter name, case-insensitive). Claims become
 * rejected; listings they created are hidden (approved ones too). &keep_first=1
 * keeps their earliest listing (one free listing per owner); &notify=1 emails
 * them once that extra listings go through Business Spotlight. Admin key required.
 */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = (req.nextUrl.searchParams.get("name") || "").trim();
  if (name.length < 4) return NextResponse.json({ error: "name required" }, { status: 400 });
  await dirSchema();
  const keepFirst = req.nextUrl.searchParams.get("keep_first") === "1";
  const { rows: first } = await pool.query(`SELECT id FROM business_claims WHERE lower(name) = lower($1) AND order_id IS NULL ORDER BY created_at LIMIT 1`, [name]);
  const keepId = keepFirst ? first[0]?.id ?? 0 : 0;
  const { rows } = await pool.query(
    `UPDATE business_claims SET status = 'rejected', reviewed_by = 'admin', reviewed_at = now() WHERE lower(name) = lower($1) AND order_id IS NULL AND id <> $2 RETURNING business_id, email, site_slug`, [name, keepId]);
  const ids = rows.map((r) => r.business_id);
  // hide the listings they created (not imported ones they claimed: those go back to unclaimed)
  const { rowCount: hidden } = await pool.query(`UPDATE businesses SET status = 'hidden', updated_at = now() WHERE id = ANY($1::int[]) AND source = 'owner'`, [ids]);
  const { rowCount: unclaimed } = await pool.query(`UPDATE businesses SET claimed = FALSE, owner_email = NULL, updated_at = now() WHERE id = ANY($1::int[]) AND source <> 'owner'`, [ids]);
  await pool.query(`UPDATE business_sites SET status = 'canceled' WHERE business_id = ANY($1::int[]) AND status = 'draft'`, [ids]).catch(() => null);
  let notified = false;
  if (req.nextUrl.searchParams.get("notify") === "1" && rows.length && process.env.RESEND_API_KEY) {
    const { sites } = await import("@/config/sites");
    const { Resend } = await import("resend");
    const site = sites[rows[0].site_slug];
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `${site?.name || "Express"} Directory <contact@alabama-express.com>`, to: rows[0].email, replyTo: process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com",
      subject: "About your directory listings",
      html: `<p>Hello,</p><p>Thanks for submitting your businesses to our state business directories. Each owner gets <b>one free listing</b>${keepId ? ", and we kept your first one for review" : ""}; the other ${rows.length} submissions were not published.</p>
<p>More businesses or locations can be listed with <b>Business Spotlight</b> ($49 each, one-time): top of the city list for 12 months plus a profile article, clearly labelled as sponsored. Choose Spotlight on the "Add your business" page of the newspaper for that state.</p>
<p>For many listings across states, reply to this email and we'll send you a bulk price.</p><p>Directory team</p>`,
    }).catch(() => ({ error: true }));
    notified = !error;
  }
  return NextResponse.json({ rejected: rows.length, hidden, unclaimed, kept: keepId || null, notified });
}
