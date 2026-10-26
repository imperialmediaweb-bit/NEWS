import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensureOrdersSchema } from "@/lib/orders-schema";
import { keyFromRequest, orderKeyAccepted } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Take a placement back so the order can publish it again.
 *
 *   POST /api/admin/orders/redo
 *     { key, orderId, sites: ["alabama-express", ...], dryRun? }
 *
 * This exists because of a real mistake rather than a hypothetical one. A
 * client bought their exact words on fifty papers; the first nineteen went out
 * rewritten, with nineteen near-duplicate titles, before identical_text was
 * set. Nothing could undo that: publishing is resumable precisely because it
 * skips sites already in order_placements, so a site that published wrongly
 * published wrongly for good.
 *
 * It deletes the article and the placement row, and nothing else. The order,
 * its copy, its token and its other forty-nine placements are untouched, so
 * the next publish run simply finds those sites unplaced and does them again —
 * this time under whatever settings the order now carries.
 *
 * Deliberately narrow: it only ever touches articles this order placed, only
 * on the sites named, and `dryRun` shows exactly what would go first. There is
 * no "redo everything", because the blast radius of a typo should not be
 * fifty live pages.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  if (!orderKeyAccepted(keyFromRequest(req, body.key as string | undefined))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = Number(body.orderId);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const requested: string[] = Array.isArray(body.sites)
    ? (body.sites as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  if (requested.length === 0) {
    return NextResponse.json(
      { error: "sites is required — name the sites to redo, one slug each" },
      { status: 400 }
    );
  }
  const unknown = requested.filter((slug) => !sites[slug]);
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Not sites on this network: ${unknown.join(", ")}` },
      { status: 400 }
    );
  }

  await ensureOrdersSchema();

  // Only this order's placements, only the sites named.
  const { rows: targets } = await pool.query(
    `SELECT p.site_slug, p.article_id, p.url, a.title
       FROM order_placements p
       LEFT JOIN articles a ON a.id = p.article_id
      WHERE p.order_id = $1 AND p.site_slug = ANY($2::text[])`,
    [orderId, requested]
  );

  if (targets.length === 0) {
    return NextResponse.json({
      orderId,
      message: "No placements on those sites for this order — nothing to take back",
      removed: [],
    });
  }

  if (body.dryRun === true) {
    return NextResponse.json({
      dryRun: true,
      orderId,
      wouldRemove: targets.map((t) => ({
        site: t.site_slug,
        articleId: t.article_id,
        title: t.title,
        url: t.url,
      })),
    });
  }

  const removed: Record<string, unknown>[] = [];
  for (const t of targets) {
    try {
      // The article first: a placement without its article is a dangling row
      // in the client's report, which is worse than one of each.
      if (t.article_id) {
        await pool.query("DELETE FROM articles WHERE id = $1", [t.article_id]);
      }
      await pool.query("DELETE FROM order_placements WHERE order_id = $1 AND site_slug = $2", [
        orderId,
        t.site_slug,
      ]);
      removed.push({ site: t.site_slug, articleId: t.article_id, title: t.title, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "delete failed";
      console.error(`[orders/redo] order ${orderId} site ${t.site_slug}:`, message);
      removed.push({ site: t.site_slug, ok: false, error: message });
    }
  }

  const { rows: left } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM order_placements WHERE order_id = $1",
    [orderId]
  );

  return NextResponse.json({
    ok: true,
    orderId,
    removed,
    stillPlaced: left[0]?.n ?? null,
    next: "Publish the order again — those sites are unplaced now and will be redone.",
  });
}
