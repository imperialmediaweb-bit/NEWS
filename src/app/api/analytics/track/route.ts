import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Lightweight page view tracker.
 * Called from client-side on each page load.
 * Stores: site, path, referrer, user agent, country (from header), timestamp.
 */
// is_bot marks automated browsers (headless Chrome, webdriver) that run our script,
// so the admin can show real visitors apart from them.
let col: Promise<unknown> | null = null;
const AUTOMATED = /headless|lightpanda|puppeteer|playwright|phantomjs|selenium|electron/i;

export async function POST(req: NextRequest) {
  try {
    const { path, referrer, title, wd } = await req.json();
    col ??= pool.query("ALTER TABLE page_views ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE").catch(() => { col = null; });
    await col;
    if (!path) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "";
    const ua = req.headers.get("user-agent") || "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get site_id from domain
    const { rows: siteRows } = await pool.query(
      "SELECT id FROM sites WHERE domain = $1 LIMIT 1",
      [host]
    );
    const siteId = siteRows.length > 0 ? siteRows[0].id : null;

    // Detect bot (don't count bot visits)
    const isBot =
      /bot|crawl|spider|slurp|mediapartners|adsbot|bingpreview|facebookexternalhit|twitterbot/i.test(
        ua
      );

    if (!isBot) {
      const automated = wd === true || AUTOMATED.test(ua) || !req.headers.get("accept-language");
      await pool.query(
        `INSERT INTO page_views (site_id, path, title, referrer, user_agent, ip_hash, created_at, is_bot)
         VALUES ($1, $2, $3, $4, $5, encode(sha256($6::bytea), 'hex'), NOW(), $7)`,
        [
          siteId,
          path.slice(0, 500),
          (title || "").slice(0, 300),
          (referrer || "").slice(0, 500),
          ua.slice(0, 500),
          ip,
          automated,
        ]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ ok: false });
  }
}
