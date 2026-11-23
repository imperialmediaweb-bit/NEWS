import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { findImage } from "@/lib/pipeline/images";
import { storeImage } from "@/lib/pipeline/image-store";

/**
 * Re-pick the photo of published stories that got an archive picture from
 * Openverse (public-domain-mark photos, Library of Congress, National
 * Archives, Lewis Hine...). GET ?dry=1 lists them; without dry it fixes up to
 * `limit` per call (default 40), newest first.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const BAD = `(library of congress|national archives|hine|smithsonian|internet archive|nypl|new york public library|gage skidmore|the white house)`;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const token = p.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(Number(p.get("limit") || 40), 200);
  const { rows } = await pool.query(
    `SELECT a.id, a.title, a.category, s.slug AS site, a.image_credit FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE a.image_credit ~* $1 OR (a.image_credit ILIKE '%Public domain%' AND a.image_credit ~* '(Wikimedia|Flickr)')
      ORDER BY a.published_at DESC LIMIT $2`,
    [BAD, p.get("dry") ? 500 : limit]
  );
  if (p.get("dry")) return NextResponse.json({ found: rows.length, sample: rows.slice(0, 15).map((r) => [r.site, r.title, r.image_credit]) });
  const done: Array<[number, string, string | null]> = [];
  for (const r of rows) {
    const state = sites[r.site]?.state;
    const img = await findImage(r.title, r.category, { title: r.title, state }).catch(() => null);
    if (!img?.url) { done.push([r.id, r.title, null]); continue; }
    const stored = await storeImage(img.url, r.title).catch(() => null);
    await pool.query(`UPDATE articles SET featured_image = $2, image_credit = $3 WHERE id = $1`, [r.id, stored || img.url, img.credit || null]);
    done.push([r.id, r.title, img.credit || ""]);
  }
  return NextResponse.json({ fixed: done.filter((d) => d[2] !== null).length, failed: done.filter((d) => d[2] === null).length, done: done.slice(0, 20) });
}
