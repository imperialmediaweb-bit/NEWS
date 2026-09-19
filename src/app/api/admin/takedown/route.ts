import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { getSiteId } from "@/lib/site-id";
import { submitGoogleIndexing } from "@/lib/indexing";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Remove an article, for when someone written about says it is wrong.
 *
 * There was no way to unpublish anything. A person emailed to say an article
 * about him states he began the event in his freshman year when he started at
 * the end of his junior year, that he was still weighing options when he had
 * already signed with a university, that he is from a city at the other end of
 * the state, and that the photograph is not him. Correcting that by hand in
 * the database is not something to do under pressure, and there was no other
 * option at all.
 *
 *   GET /api/admin/takedown?key=CRON_SECRET&site=<slug>&slug=<article-slug>
 *   GET /api/admin/takedown?key=CRON_SECRET&site=<slug>&slug=<slug>&confirm=1
 *
 * Without confirm=1 it only shows what it would remove, so a wrong slug cannot
 * delete the wrong story. With confirm=1 it deletes the row and asks Google to
 * drop the URL, which is the part that actually matters to the person
 * complaining — the page disappearing from search is what stops it following
 * them around.
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteSlug = req.nextUrl.searchParams.get("site");
  const articleSlug = req.nextUrl.searchParams.get("slug");
  const confirm = req.nextUrl.searchParams.get("confirm") === "1";
  // Same title can exist on several sites (a campaign, a syndicated piece).
  const everywhere = req.nextUrl.searchParams.get("everywhere") === "1";

  if (!articleSlug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  if (!everywhere && !siteSlug) {
    return NextResponse.json(
      { error: "site is required, or pass everywhere=1" },
      { status: 400 }
    );
  }

  let rows;
  if (everywhere) {
    ({ rows } = await pool.query(
      `SELECT a.id, a.title, a.slug, a.category, a.published_at, s.slug AS site_slug, s.domain
         FROM articles a JOIN sites s ON a.site_id = s.id
        WHERE a.slug = $1`,
      [articleSlug]
    ));
  } else {
    const siteId = await getSiteId(siteSlug!);
    if (siteId === null) {
      return NextResponse.json({ error: `Unknown site: ${siteSlug}` }, { status: 400 });
    }
    const site = sites[siteSlug!];
    ({ rows } = await pool.query(
      `SELECT id, title, slug, category, published_at, $2::text AS site_slug, $3::text AS domain
         FROM articles WHERE site_id = $1 AND slug = $4`,
      [siteId, siteSlug, site?.domain || "", articleSlug]
    ));
  }

  if (rows.length === 0) {
    return NextResponse.json({ found: 0, message: "No matching article" }, { status: 404 });
  }

  const matches = rows.map((r) => ({
    id: r.id,
    site: r.site_slug,
    title: r.title,
    url: `https://${r.domain}/${r.category || "local-news"}/${r.slug}`,
    publishedAt: r.published_at,
  }));

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      found: matches.length,
      matches,
      message: "Nothing removed. Add &confirm=1 to delete these.",
    });
  }

  const ids = rows.map((r) => r.id);
  await pool.query("DELETE FROM articles WHERE id = ANY($1::int[])", [ids]);

  // Ask Google to drop the URL rather than waiting for a recrawl. Best effort:
  // the deletion is what counts, and this must not fail the request.
  const deindexed: Record<string, boolean> = {};
  for (const m of matches) {
    deindexed[m.url] = await submitGoogleIndexing(m.url, "URL_DELETED").catch(() => false);
  }

  return NextResponse.json({
    removed: matches.length,
    matches,
    deindexRequested: deindexed,
    note:
      "Removed from the site. Google may still show a cached result for a short time; the removal request above asks it to drop the URL.",
  });
}
