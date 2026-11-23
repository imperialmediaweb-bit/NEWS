import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ensurePaidTable } from "@/lib/paid";

/** The featured sponsored story currently on this site's homepage (7 days after publishing), if any. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ featured: null });
  await ensurePaidTable();
  const { rows } = await pool.query(
    `SELECT title, business, photo_url, article_slug FROM paid_orders
      WHERE site_slug = $1 AND product IN ('featured', 'spotlight_home') AND status = 'published' AND published_at > now() - interval '7 days'
      ORDER BY random() LIMIT 1`,
    [site.slug]
  );
  return NextResponse.json({ featured: rows[0] || null }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
