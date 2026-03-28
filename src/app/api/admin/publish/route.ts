import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, summary, category, author, featured_image, sites: siteSlugs } = body;

    if (!title || !siteSlugs?.length) {
      return NextResponse.json({ error: "Title and sites required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Get site IDs for selected slugs
    const placeholders = siteSlugs.map((_: string, i: number) => `$${i + 1}`).join(", ");
    const { rows: siteRows } = await pool.query(
      `SELECT id, slug FROM sites WHERE slug IN (${placeholders})`,
      siteSlugs
    );

    // Insert article for each site
    const results = [];
    for (const site of siteRows) {
      const { rows } = await pool.query(
        `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (site_id, slug) DO NOTHING
         RETURNING id`,
        [site.id, title, slug, content || "", summary || "", category || "general", author || "Staff Reporter", featured_image || ""]
      );
      results.push({ site: site.slug, inserted: rows.length > 0 });
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
