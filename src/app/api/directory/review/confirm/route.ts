import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { dirSchema } from "@/lib/directory";

/** The emailed link: publish the review and update the business's rating. */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") || "";
  await dirSchema();
  const { rows } = await pool.query(`UPDATE business_reviews SET verified = TRUE WHERE token = $1 AND NOT verified RETURNING business_id, rating`, [t.slice(0, 64)]);
  const r = rows[0];
  if (r) await pool.query(`UPDATE businesses SET rating_sum = rating_sum + $2, rating_count = rating_count + 1, updated_at = now() WHERE id = $1`, [r.business_id, r.rating]);
  const { rows: b } = await pool.query(`SELECT b.slug FROM business_reviews x JOIN businesses b ON b.id = x.business_id WHERE x.token = $1`, [t.slice(0, 64)]);
  return NextResponse.redirect(new URL(b[0] ? `/directory/listing/${b[0].slug}?confirmed=1#reviews` : "/directory", `https://${(req.headers.get("host") || "").split(":")[0]}`));
}
