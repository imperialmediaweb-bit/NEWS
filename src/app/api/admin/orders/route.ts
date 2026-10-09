import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureOrdersSchema, newReportToken, clientDomain } from "@/lib/orders-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Paid placement orders.
 *
 *   GET  /api/admin/orders?key=CRON_SECRET            list, with progress
 *   GET  /api/admin/orders?key=...&id=12              one order and its placements
 *   POST /api/admin/orders   { key, client, clientUrl, ... }   create
 *   PATCH /api/admin/orders  { key, id, ...fields }            update
 *
 * Progress is counted from order_placements — one row per site the order
 * actually went live on — rather than estimated from a status field. "31 of 50"
 * is then a fact, and a client report is built from the same rows.
 */

function authorised(req: NextRequest, bodyKey?: string): boolean {
  const key =
    bodyKey ||
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.CRON_SECRET) && key === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureOrdersSchema();

  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const { rows: placements } = await pool.query(
      `SELECT site_slug, article_id, url, placed_at
         FROM order_placements WHERE order_id = $1 ORDER BY placed_at`,
      [id]
    );
    return NextResponse.json({ order: rows[0], placements });
  }

  const status = req.nextUrl.searchParams.get("status");

  // One query, with the placement count joined — listing orders and then
  // counting each one separately is a query per row on a page that exists to
  // be refreshed.
  const { rows } = await pool.query(
    `SELECT o.*, count(p.site_slug)::int AS published_count
       FROM orders o
       LEFT JOIN order_placements p ON p.order_id = o.id
      ${status ? "WHERE o.status = $1" : ""}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 200`,
    status ? [status] : []
  );

  return NextResponse.json({
    count: rows.length,
    orders: rows.map((o) => ({
      ...o,
      // The report link, ready to send. Without the token the client gets an
      // admin URL and an "unauthorized".
      reportUrl: o.token ? `/report/${o.token}` : null,
    })),
  });
}

/** Create an order. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!authorised(req, body.key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = String(body.client || "").trim();
  const clientUrl = String(body.clientUrl || "").trim();
  if (!client || !clientUrl) {
    return NextResponse.json(
      { error: "client and clientUrl are required" },
      { status: 400 }
    );
  }
  if (!clientDomain(clientUrl)) {
    return NextResponse.json(
      { error: `clientUrl is not a usable URL: ${clientUrl}` },
      { status: 400 }
    );
  }

  await ensureOrdersSchema();

  const { rows } = await pool.query(
    `INSERT INTO orders
       (external_ref, client, email, phone, client_url, package, price, currency,
        paid, title, material, images, notes, category, identical_text,
        imported_text, site_instructions, token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (external_ref) DO NOTHING
     RETURNING id, token`,
    [
      body.externalRef || null,
      client,
      body.email || null,
      body.phone || null,
      clientUrl,
      body.package || null,
      body.price ?? null,
      body.currency || "USD",
      Boolean(body.paid),
      body.title || null,
      body.material || null,
      body.images ? JSON.stringify(body.images) : null,
      body.notes || null,
      body.category || null,
      Boolean(body.identicalText),
      Boolean(body.importedText),
      body.siteInstructions ? JSON.stringify(body.siteInstructions) : null,
      newReportToken(),
    ]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: `An order with external_ref "${body.externalRef}" already exists` },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: rows[0].id,
    reportUrl: `/report/${rows[0].token}`,
  });
}

/** Update an order — payment, status, copy, section. */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!authorised(req, body.key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await ensureOrdersSchema();

  const editable: Record<string, string> = {
    client: "client",
    email: "email",
    phone: "phone",
    clientUrl: "client_url",
    package: "package",
    price: "price",
    currency: "currency",
    paid: "paid",
    title: "title",
    material: "material",
    notes: "notes",
    status: "status",
    category: "category",
    identicalText: "identical_text",
  };

  const sets: string[] = [];
  const params: unknown[] = [body.id];

  for (const [key, column] of Object.entries(editable)) {
    if (body[key] !== undefined) {
      sets.push(`${column} = $${params.length + 1}`);
      params.push(body[key]);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE orders SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    params
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: rows[0] });
}
