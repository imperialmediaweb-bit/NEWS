import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";

/** Today's stories with a picture, for the phone "stories" viewer on the homepage. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ stories: [] });
  const { rows } = await pool.query(
    `SELECT a.title, a.slug, a.category, a.featured_image AS image, a.published_at
       FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.published_at > now() - interval '24 hours'
        AND a.featured_image IS NOT NULL AND a.featured_image <> ''
      ORDER BY a.published_at DESC LIMIT 10`,
    [site.slug]
  );
  return NextResponse.json({ stories: rows }, { headers: { "Cache-Control": "public, s-maxage=600" } });
}
