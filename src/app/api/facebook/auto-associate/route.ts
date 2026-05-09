import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/facebook";
import { sites } from "@/config/sites";

export const dynamic = "force-dynamic";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("admin_token")?.value;
  const adminSecret = process.env.CRON_SECRET || "admin123";
  if (adminCookie !== adminSecret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cleanUnmatched = body.clean === true;

  await ensureSchema();

  const { rows: pages } = await query(
    `SELECT page_id, page_name, site_slug FROM facebook_pages`
  );

  const siteList = Object.values(sites);
  let matched = 0;
  let already = 0;
  const unmatched: string[] = [];
  const unmatchedIds: string[] = [];

  for (const page of pages) {
    if (page.site_slug && siteList.some((s) => s.slug === page.site_slug)) { already++; continue; }

    const normalizedPage = normalize(page.page_name);
    const match = siteList.find((s) => {
      const normalizedName = normalize(s.name);
      const normalizedSlug = normalize(s.slug);
      return normalizedPage === normalizedName
        || normalizedPage === normalizedSlug
        || normalizedPage.includes(normalizedName)
        || normalizedName.includes(normalizedPage);
    });

    if (match) {
      await query(
        `UPDATE facebook_pages SET site_slug = $1, updated_at = NOW() WHERE page_id = $2`,
        [match.slug, page.page_id]
      );
      matched++;
    } else {
      unmatched.push(page.page_name);
      unmatchedIds.push(page.page_id);
    }
  }

  let removed = 0;
  if (cleanUnmatched && unmatchedIds.length > 0) {
    for (const pid of unmatchedIds) {
      await query(`DELETE FROM facebook_pages WHERE page_id = $1`, [pid]);
      removed++;
    }
  }

  return NextResponse.json({ matched, already, unmatched, removed, total: pages.length });
}
