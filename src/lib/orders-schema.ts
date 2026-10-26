import crypto from "crypto";
import pool from "@/lib/db";

/**
 * Paid placement orders.
 *
 * Ported from the Romanian network's `comenzi` module, which has been selling
 * through this model for months. Nearly every column here exists because
 * something went wrong without it, and those notes are kept: they are the part
 * worth more than the code.
 *
 * The shape is two tables. `orders` is what the client bought. `order_placements`
 * is one row per site it actually went live on — which is what makes "31 of 50
 * published" a counted fact rather than an estimate, and what a client report
 * is built from.
 */

let ready = false;

export async function ensureOrdersSchema(): Promise<void> {
  if (ready) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id              SERIAL PRIMARY KEY,
      external_ref    TEXT UNIQUE,
      client          TEXT NOT NULL,
      email           TEXT,
      phone           TEXT,
      client_url      TEXT NOT NULL,
      package         TEXT,
      price           NUMERIC,
      currency        TEXT DEFAULT 'USD',
      paid            BOOLEAN DEFAULT FALSE,
      title           TEXT,
      material        TEXT,
      images          TEXT,
      notes           TEXT,
      status          TEXT DEFAULT 'new',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      published_at    TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_placements (
      order_id   INT  NOT NULL,
      site_slug  TEXT NOT NULL,
      article_id INT,
      url        TEXT,
      placed_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (order_id, site_slug)
    )
  `);

  // The client's report has to open without a password. In the original the
  // report button pointed at an /api/admin/ address, so the link sent to the
  // client answered "unauthorized" and the only way to deliver it was to save
  // the page as a PDF. Each order carries its own random token instead, and
  // /report/<token> shows that order and nothing else.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS token TEXT`);

  // Per-site instructions ("Dallas: run this on the 28th") and per-site images,
  // because a campaign is rarely identical everywhere even when the copy is.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS site_instructions TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS site_images TEXT`);

  // The client supplied finished text per site rather than one piece to be
  // rewritten. This matters to any tool that decides an article belongs to an
  // order by checking whether it contains the client's domain: on these the
  // links are split between website, Facebook and Instagram, so that test is
  // no longer valid and a tool relying on it would unlink half the report.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS imported_text BOOLEAN DEFAULT FALSE`);

  // Published with rewriting deliberately off — the client wanted their exact
  // title and copy on every site. Anything that hunts duplicate titles has to
  // leave these alone.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS identical_text BOOLEAN DEFAULT FALSE`);

  // "You don't tell me when it finishes?" — sent once, by the completion job.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS completion_emailed_at TIMESTAMPTZ`);

  // Orders default to the advertising section. Some clients ask for another —
  // a profile piece sits more naturally under business than under advertising.
  // The sponsored-content disclosure is not affected by this and is not
  // optional; only which section it files under changes.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS category TEXT`);

  // The pace the buyer chose: how many sites go out per run, and how long to
  // wait before the next one. Two numbers rather than one because the same
  // fifty sites are sold both as "everything inside half an hour" and as "five
  // a day for ten days", and those differ in the gap, not the batch.
  //
  // next_publish_at is what makes it run without anybody pressing a button:
  // the cron takes every paid order that is due, publishes one run, and pushes
  // the stamp forward. NULL means nothing is scheduled — the order is only
  // published by hand — so an order that was never given a pace cannot start
  // publishing itself behind someone's back.
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pace_per_run INT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pace_every_minutes INT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_publish_at TIMESTAMPTZ`);

  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_token ON orders(token) WHERE token IS NOT NULL`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_order_placements_order ON order_placements(order_id)`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_due ON orders(next_publish_at) WHERE next_publish_at IS NOT NULL`
  );

  ready = true;
}

/** 24 random bytes: long enough that a report URL cannot be guessed. */
export function newReportToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * The client's bare domain, for deciding whether a published article belongs
 * to this order. Returns null when the URL is unusable, so callers can tell
 * "no domain" from "some domain" instead of matching on an empty string.
 */
export function clientDomain(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export interface Order {
  id: number;
  client: string;
  email: string | null;
  client_url: string;
  package: string | null;
  price: string | null;
  currency: string;
  paid: boolean;
  title: string | null;
  material: string | null;
  status: string;
  token: string | null;
  category: string | null;
  identical_text: boolean;
  created_at: string;
  published_at: string | null;
}
