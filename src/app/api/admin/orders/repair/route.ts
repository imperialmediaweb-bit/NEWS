import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensureOrdersSchema } from "@/lib/orders-schema";
import { keyFromRequest, orderKeyAccepted } from "@/lib/shop-auth";
import { paragraphize } from "@/lib/paragraphs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Rewrite an order's live placements in place, without touching their URLs.
 *
 *   POST /api/admin/orders/repair
 *     { key, orderId, dryRun? }
 *
 * The sibling route takes a placement back so it can be published again, which
 * gives the article a new address. That is the wrong tool once the client has
 * the report: every link in it would die and come back somewhere else. This
 * one keeps the slug — the address the client already has — and changes only
 * the title and the body.
 *
 * It does two things the first publication got wrong. The copy goes back to
 * what the client actually bought, identical on every site, undoing a run of
 * rewrites nobody asked for. And the text becomes paragraphs instead of the
 * single unbroken block it was inserted as.
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

  await ensureOrdersSchema();

  const { rows: orders } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  const order = orders[0];
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const material = String(order.material || "").trim();
  if (material.length < 50) {
    return NextResponse.json(
      { error: "This order has no copy to restore — set `material` first." },
      { status: 400 }
    );
  }
  const title = String(order.title || order.client || "").trim();
  if (!title) {
    return NextResponse.json({ error: "This order has no title to restore." }, { status: 400 });
  }

  const { rows: placements } = await pool.query(
    `SELECT p.site_slug, p.article_id, p.url, a.title AS current_title
       FROM order_placements p
       LEFT JOIN articles a ON a.id = p.article_id
      WHERE p.order_id = $1 AND p.article_id IS NOT NULL
      ORDER BY p.site_slug`,
    [orderId]
  );

  if (placements.length === 0) {
    return NextResponse.json({ orderId, message: "Nothing placed yet", repaired: [] });
  }

  if (body.dryRun === true) {
    return NextResponse.json({
      dryRun: true,
      orderId,
      newTitle: title,
      wouldRepair: placements.map((p) => ({
        site: p.site_slug,
        url: p.url,
        from: p.current_title,
        to: title,
        changesTitle: p.current_title !== title,
      })),
    });
  }

  const client = String(order.client || "");
  const clientUrl = String(order.client_url || "");
  const repaired: Record<string, unknown>[] = [];

  for (const p of placements) {
    const site = sites[p.site_slug as string];
    try {
      const html = render(material, client, clientUrl);
      await pool.query(
        // The slug is deliberately not in this UPDATE. It is the address the
        // client was given, and it is not ours to change afterwards.
        "UPDATE articles SET title = $2, content = $3, summary = $4 WHERE id = $1",
        [p.article_id, title, html, summarize(material)]
      );
      repaired.push({
        site: p.site_slug,
        state: site?.state || null,
        url: p.url,
        was: p.current_title,
        ok: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "update failed";
      console.error(`[orders/repair] order ${orderId} site ${p.site_slug}:`, message);
      repaired.push({ site: p.site_slug, ok: false, error: message });
    }
  }

  const failed = repaired.filter((r) => !r.ok).length;
  return NextResponse.json({
    ok: failed === 0,
    orderId,
    title,
    repaired: repaired.length - failed,
    failed,
    details: repaired,
    note: "Addresses are unchanged — every link in the client's report still works.",
  });
}

/** The first couple of sentences, for the listing pages. */
function summarize(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 200) return flat;
  const cut = flat.slice(0, 200);
  const stop = cut.lastIndexOf(". ");
  return (stop > 80 ? cut.slice(0, stop + 1) : cut).trim();
}

/**
 * The same shape the publisher writes: one disclosure, the copy as paragraphs,
 * the client's link rendered so it cannot pass ranking credit.
 */
function render(content: string, client: string, clientUrl: string): string {
  const disclosure = `<p style="margin:0 0 20px;font-size:0.85em;color:#666;"><em>Sponsored content${
    client ? ` paid for by ${escapeHtml(client)}` : ""
  } — not produced by our newsroom.</em></p>`;

  const footer = clientUrl
    ? `<p><a href="${escapeHtml(clientUrl)}" rel="sponsored nofollow noopener" target="_blank">Learn more${
        client ? ` about ${escapeHtml(client)}` : ""
      }</a></p>`
    : "";

  return `${disclosure}${paragraphize(content)}${footer}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
