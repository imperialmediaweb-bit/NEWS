import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteId } from "@/lib/site-id";
import { submitGoogleIndexing } from "@/lib/indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Replace a published article's text and append a correction notice.
 *
 * Someone who has been written about inaccurately usually asks for the article
 * to be fixed, not deleted — which is what happened here. Deleting is easy and
 * quietly pretends nothing was published; correcting is the thing a
 * publication is supposed to do, and it needs the correction to be visible
 * rather than a silent edit.
 *
 *   POST /api/admin/correct
 *     {
 *       key, site, slug,
 *       title?, summary?, content?,
 *       featuredImage?: string | null,   // null removes the image
 *       correction: "what was wrong and what changed",
 *       keepSlug?: boolean               // default true
 *     }
 *
 * The URL is preserved by default. Anyone who read the wrong version, or who
 * finds it through a search result or a link someone sent them, lands on the
 * corrected one — which is the entire point.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const key =
    body.key ||
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { site: siteSlug, slug, correction } = body;
  if (!siteSlug || !slug) {
    return NextResponse.json({ error: "site and slug are required" }, { status: 400 });
  }
  if (!correction || String(correction).trim().length < 10) {
    return NextResponse.json(
      {
        error:
          "correction is required — a correction without a note saying what changed is a silent edit, which is the thing to avoid",
      },
      { status: 400 }
    );
  }

  const siteId = await getSiteId(siteSlug);
  if (siteId === null) {
    return NextResponse.json({ error: `Unknown site: ${siteSlug}` }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT a.id, a.title, a.slug, a.category, a.content, s.domain
       FROM articles a JOIN sites s ON a.site_id = s.id
      WHERE a.site_id = $1 AND a.slug = $2`,
    [siteId, slug]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  const existing = rows[0];

  const noticeDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Placed at the top: a reader who arrives from a search result showing the
  // old headline should see immediately that it was wrong, not discover it in
  // a footnote after reading the whole thing.
  const notice = `<p><strong>Correction — ${noticeDate}:</strong> ${escapeHtml(
    String(correction).trim()
  )}</p><hr />`;

  const newContent = body.content ? notice + body.content : notice + existing.content;

  const sets: string[] = ["content = $2"];
  const params: unknown[] = [existing.id, newContent];
  let n = 3;

  if (body.title) {
    sets.push(`title = $${n++}`);
    params.push(body.title);
  }
  if (body.summary !== undefined) {
    sets.push(`summary = $${n++}`);
    params.push(body.summary);
  }
  // An explicit null clears the image — the right move when the picture is of
  // somebody else, which is a complaint that comes up on its own.
  if (body.featuredImage !== undefined) {
    sets.push(`featured_image = $${n++}`);
    params.push(body.featuredImage);
  }

  await pool.query(`UPDATE articles SET ${sets.join(", ")} WHERE id = $1`, params);

  const url = `https://${existing.domain}/${existing.category || "local-news"}/${existing.slug}`;

  // Ask Google to re-crawl so the corrected version replaces the cached one.
  const reindexed = await submitGoogleIndexing(url, "URL_UPDATED").catch(() => false);

  return NextResponse.json({
    ok: true,
    url,
    titleChanged: Boolean(body.title),
    imageRemoved: body.featuredImage === null,
    reindexRequested: reindexed,
    correction: String(correction).trim(),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
