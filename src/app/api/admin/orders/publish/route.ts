import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { getSiteId } from "@/lib/site-id";
import { ensureOrdersSchema } from "@/lib/orders-schema";
import { keyFromRequest, orderKeyAccepted } from "@/lib/shop-auth";
import { rewriteCampaignForSite } from "@/lib/pipeline/rewriter";
import { submitToAllEngines } from "@/lib/indexing";
import { submitToIndexNow } from "@/lib/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Publish a paid order across the network.
 *
 *   POST /api/admin/orders/publish
 *     { key, orderId, perRun?, sites?: ["texas-express", ...], dryRun? }
 *
 * Resumable by design: sites already in order_placements are skipped, so a run
 * that times out or is interrupted is continued simply by calling it again.
 * Each placement is written the moment the article is inserted rather than at
 * the end of the batch — the Romanian original learned that the hard way, and
 * its note says why: if the server stops halfway, what was published stays
 * linked. An article published but not recorded is worse than one not
 * published at all, because nothing afterwards knows it exists.
 *
 * Every placement carries a sponsored-content disclosure and renders the
 * client's link rel="sponsored nofollow noopener". Neither is configurable.
 * That is the line between selling advertising and selling ranking credit, and
 * crossing it is what costs a network its search visibility.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!orderKeyAccepted(keyFromRequest(req, body.key))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = Number(body.orderId);
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  await ensureOrdersSchema();

  const { rows: orders } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (orders.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = orders[0];

  if (!order.material || String(order.material).trim().length < 50) {
    return NextResponse.json(
      { error: "This order has no copy to publish — set `material` first." },
      { status: 400 }
    );
  }

  // Which sites are already done. Skipping them is what makes a second call
  // continue rather than duplicate.
  const { rows: done } = await pool.query(
    "SELECT site_slug FROM order_placements WHERE order_id = $1",
    [orderId]
  );
  const alreadyPlaced = new Set(done.map((d) => d.site_slug as string));

  const requested: string[] = Array.isArray(body.sites) && body.sites.length > 0
    ? body.sites
    : Object.values(sites).map((s) => s.slug);

  const todo = requested.filter((slug) => sites[slug] && !alreadyPlaced.has(slug));
  const perRun = Math.min(50, Math.max(1, Number(body.perRun) || 10));
  const batch = todo.slice(0, perRun);
  const dryRun = body.dryRun === true;

  if (batch.length === 0) {
    return NextResponse.json({
      orderId,
      message: "Nothing left to publish",
      published: alreadyPlaced.size,
      remaining: 0,
    });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      orderId,
      wouldPublishOn: batch,
      alreadyPublishedOn: alreadyPlaced.size,
      remainingAfter: todo.length - batch.length,
    });
  }

  const category = String(order.category || "business")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const results: Record<string, unknown>[] = [];

  for (const slug of batch) {
    const site = sites[slug];
    try {
      const siteId = await getSiteId(slug);
      if (siteId === null) {
        results.push({ site: slug, ok: false, error: "No site row" });
        continue;
      }

      let title = String(order.title || order.client);
      let summary = "";
      let copy = String(order.material);
      let rewritten = false;

      // identical_text means the client bought their exact words everywhere and
      // rewriting them would be wrong, not clever.
      if (!order.identical_text) {
        try {
          const out = await rewriteCampaignForSite(
            site.name,
            site.state,
            site.city,
            title,
            copy,
            String(order.client || "")
          );
          if (out.content && out.title) {
            title = out.title;
            summary = out.summary || "";
            copy = out.content;
            rewritten = true;
          }
        } catch (e) {
          console.error(`[orders] rewrite failed for ${slug}:`, e instanceof Error ? e.message : e);
        }
      }

      const articleSlug = buildSlug(title, site.stateAbbr || slug);
      const html = renderSponsored(
        copy,
        site.city,
        site.state,
        String(order.client || ""),
        String(order.client_url || "")
      );

      const { rows: inserted } = await pool.query(
        `INSERT INTO articles
           (site_id, title, slug, content, summary, category, author, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
         ON CONFLICT (site_id, slug) DO NOTHING
         RETURNING id`,
        [siteId, title, articleSlug, html, summary, category, "Sponsored Content"]
      );

      if (inserted.length === 0) {
        results.push({ site: slug, ok: false, error: `Duplicate slug: ${articleSlug}` });
        continue;
      }

      const url = `https://${site.domain}/${category}/${articleSlug}`;

      // Written now, not at the end of the run.
      await pool.query(
        `INSERT INTO order_placements (order_id, site_slug, article_id, url)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (order_id, site_slug) DO UPDATE
           SET article_id = EXCLUDED.article_id, url = EXCLUDED.url`,
        [orderId, slug, inserted[0].id, url]
      );

      // A paid placement is worth submitting straight away rather than waiting
      // for the two-hourly indexing run.
      await submitToIndexNow(site.domain, [url]).catch(() => false);
      await submitToAllEngines(`https://${site.domain}`, url).catch(() => null);

      results.push({ site: slug, ok: true, url, rewritten });
    } catch (e) {
      results.push({
        site: slug,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const publishedNow = results.filter((r) => r.ok).length;
  const total = alreadyPlaced.size + publishedNow;
  const remaining = todo.length - publishedNow;

  await pool.query(
    `UPDATE orders
        SET published_at = COALESCE(published_at, NOW()),
            status = CASE WHEN $2::int = 0 THEN 'published' ELSE 'publishing' END
      WHERE id = $1`,
    [orderId, remaining]
  );

  return NextResponse.json({
    orderId,
    publishedNow,
    publishedTotal: total,
    remaining,
    reportUrl: order.token ? `/report/${order.token}` : null,
    results,
  });
}

function buildSlug(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 180);
  return `${base}-${suffix.toLowerCase()}`;
}

/**
 * Wrap the client's copy with the disclosure a paid placement requires, and
 * render their link so it cannot pass ranking credit.
 */
function renderSponsored(
  content: string,
  city: string,
  state: string,
  client: string,
  clientUrl: string
): string {
  const disclosure = `<p><em>This is sponsored content${
    client ? ` paid for by ${escapeHtml(client)}` : ""
  }. It was not produced by our newsroom.</em></p>`;

  const intro = `<p>The following is a sponsored message for readers in ${escapeHtml(
    city
  )}, ${escapeHtml(state)}.</p>`;

  const footer = clientUrl
    ? `<p><a href="${escapeHtml(
        clientUrl
      )}" rel="sponsored nofollow noopener" target="_blank">Learn more${
        client ? ` about ${escapeHtml(client)}` : ""
      }</a></p>`
    : "";

  return `${disclosure}${intro}${content}${footer}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
