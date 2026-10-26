import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureOrdersSchema } from "@/lib/orders-schema";
import { keyFromRequest, orderKeyAccepted } from "@/lib/shop-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Advances every paid order that is due for its next run.
 *
 * The buyer chooses a pace on the shop's order form — everything inside half
 * an hour, or five sites a day for ten days — and until this existed that
 * choice was a promise somebody had to keep by hand, pressing a button in the
 * admin once a day for ten days. An order whose owner forgot simply stopped.
 *
 * It does not publish anything itself. It calls the publish route, which is
 * resumable, records each placement as it happens and does the indexing. All
 * that is added here is "whose turn is it", so there is one publishing path
 * and not two that drift apart.
 *
 * Safe to run as often as you like: an order that is not due is skipped, and
 * the stamp moves forward before the run, so a slow run cannot be started
 * twice by overlapping cron ticks.
 */
export async function GET(req: NextRequest) {
  return run(req, null);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  return run(req, body);
}

async function run(req: NextRequest, body: Record<string, unknown> | null) {
  const key = keyFromRequest(req, body?.key as string | undefined);
  if (!orderKeyAccepted(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureOrdersSchema();

  // Paid, has copy, has a pace, is due, and is not finished. The placement
  // count is what says finished — status is set by whoever last touched the
  // order and is not reliable enough to decide on.
  const { rows: due } = await pool.query(
    `SELECT o.id, o.pace_per_run, o.pace_every_minutes,
            (SELECT COUNT(*) FROM order_placements p WHERE p.order_id = o.id) AS placed
       FROM orders o
      WHERE o.paid = TRUE
        AND o.next_publish_at IS NOT NULL
        AND o.next_publish_at <= NOW()
        AND o.pace_per_run > 0
        AND o.pace_every_minutes > 0
        AND o.material IS NOT NULL
        AND length(trim(o.material)) >= 50
      ORDER BY o.next_publish_at ASC
      LIMIT 5`
  );

  if (due.length === 0) {
    return NextResponse.json({ ok: true, due: 0, ran: [] });
  }

  const origin = new URL(req.url).origin;
  const ran: Record<string, unknown>[] = [];

  for (const order of due) {
    const perRun = Number(order.pace_per_run);
    const everyMinutes = Number(order.pace_every_minutes);

    // Move the clock before publishing, not after. A run that takes four
    // minutes would otherwise still be due when the next tick arrives, and the
    // same sites would be attempted twice.
    await pool.query(
      `UPDATE orders SET next_publish_at = NOW() + ($2 || ' minutes')::interval WHERE id = $1`,
      [order.id, String(everyMinutes)]
    );

    try {
      const res = await fetch(`${origin}/api/admin/orders/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, orderId: order.id, perRun }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      const remaining = Number(data.remaining ?? NaN);
      const finished = remaining === 0;

      // Nothing left: stop the schedule so this order is not looked at again.
      if (finished) {
        await pool.query(`UPDATE orders SET next_publish_at = NULL WHERE id = $1`, [order.id]);
      }

      ran.push({
        orderId: order.id,
        perRun,
        ok: res.ok,
        published: data.published ?? null,
        remaining: Number.isFinite(remaining) ? remaining : null,
        finished,
        ...(res.ok ? {} : { error: data.error || `HTTP ${res.status}` }),
      });
    } catch (err) {
      // The stamp is already pushed forward, so a failed run is retried on the
      // next gap rather than hammered immediately.
      const message = err instanceof Error ? err.message : "publish call failed";
      console.error(`[cron/orders-publish] order ${order.id}:`, message);
      ran.push({ orderId: order.id, perRun, ok: false, error: message });
    }
  }

  return NextResponse.json({ ok: true, due: due.length, ran });
}
