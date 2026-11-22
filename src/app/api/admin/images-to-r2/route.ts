import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { storeImage } from "@/lib/pipeline/image-store";
import { r2Ready } from "@/lib/r2";

/**
 * Move existing articles' free-licence photos (Pexels, Pixabay) to our R2
 * bucket as WebP, newest first, a batch at a time. Unsplash and any other
 * host are left as they are.
 *   GET /api/admin/images-to-r2?key=CRON_SECRET&limit=200&par=6
 *   GET /api/admin/images-to-r2?key=CRON_SECRET&count=1   (how many are left)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PENDING = "featured_image ~ '(images\\.pexels\\.com|pixabay\\.com/get/|cdn\\.pixabay\\.com)' AND featured_image NOT LIKE '%#gone'";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!r2Ready()) return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
  if (req.nextUrl.searchParams.get("count")) {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM articles WHERE ${PENDING}`);
    const { rows: done } = await pool.query(`SELECT count(*)::int AS n FROM articles WHERE featured_image LIKE $1`, [`${process.env.R2_PUBLIC_URL}%`]);
    return NextResponse.json({ pending: rows[0].n, onR2: done[0].n });
  }
  const limit = Math.min(500, Number(req.nextUrl.searchParams.get("limit")) || 200);
  const par = Math.min(10, Number(req.nextUrl.searchParams.get("par")) || 6);
  const t0 = Date.now();
  const { rows } = await pool.query(`SELECT id, title, featured_image FROM articles WHERE ${PENDING} ORDER BY published_at DESC NULLS LAST LIMIT $1`, [limit]);
  let moved = 0;
  let failed = 0;
  const errors: string[] = [];
  const q = [...rows];
  await Promise.all(
    Array.from({ length: par }, async () => {
      while (q.length && Date.now() - t0 < 270000) {
        const a = q.shift()!;
        try {
          const url = await storeImage(a.featured_image, a.title);
          if (url) {
            await pool.query("UPDATE articles SET featured_image = $2 WHERE id = $1 AND featured_image = $3", [a.id, url, a.featured_image]);
            moved++;
          }
        } catch (e) {
          failed++;
          if (errors.length < 5) errors.push(String(e).slice(0, 160));
          // a photo the library no longer serves: leave the article as it is,
          // but mark it so the batch does not retry it for ever
          if (/fetch 404|fetch 410/.test(String(e))) await pool.query("UPDATE articles SET featured_image = featured_image || '#gone' WHERE id = $1 AND featured_image = $2", [a.id, a.featured_image]).catch(() => {});
        }
      }
    })
  );
  return NextResponse.json({ batch: rows.length, moved, failed, ms: Date.now() - t0, errors });
}
