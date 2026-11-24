import { NextRequest, NextResponse } from "next/server";
import { serviceArticlesTick, serviceArticleFor, TOPICS } from "@/lib/service-articles";
import pool from "@/lib/db";
import { searchPexels } from "@/lib/pipeline/images";
import { storeImage } from "@/lib/pipeline/image-store";

/** Cron: the daily "Guides" article for papers that are due (?site=slug writes one now for that paper). */
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ?fiximages=1: guides whose photo is not our own copy get a Pexels photo
  if (req.nextUrl.searchParams.get("fiximages")) {
    const { rows } = await pool.query(`SELECT a.id, a.title FROM articles a WHERE a.category = 'guides' AND (a.featured_image IS NULL OR a.featured_image NOT LIKE '%img.%') LIMIT 50`);
    const fixed = [];
    for (const r of rows) {
      const t = TOPICS.find((x) => r.title.toLowerCase().includes(x.key.split("-")[0])) ;
      const img = await searchPexels(t?.image || r.title.split(":")[0]).catch(() => null);
      if (!img?.url) continue;
      const stored = await storeImage(img.url, r.title, true).catch(() => null);
      await pool.query(`UPDATE articles SET featured_image = $2, image_credit = $3 WHERE id = $1`, [r.id, stored || img.url, img.credit || null]);
      fixed.push(r.title);
    }
    return NextResponse.json({ fixed });
  }
  const one = req.nextUrl.searchParams.get("site");
  if (one) return NextResponse.json({ site: one, article: await serviceArticleFor(one) });
  return NextResponse.json({ done: await serviceArticlesTick(3) });
}
