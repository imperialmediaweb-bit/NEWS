import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites, getSiteByDomain } from "@/config/sites";

export const dynamic = "force-dynamic";

/**
 * Public advertising enquiries — the missing half of selling anything.
 *
 * /advertise lists what the network offers and then stops: there is no way for
 * a reader of that page to order it. The campaign module can publish a paid
 * placement across all fifty sites, but a request has to reach it by email and
 * be typed in by hand.
 *
 * This takes the enquiry, stores it, and puts everything the campaign module
 * needs in one row, so turning an enquiry into a campaign is a decision rather
 * than a transcription job.
 *
 * Deliberately not automatic: an enquiry is never published without someone
 * approving it. A public endpoint that could put text on fifty news sites
 * unattended would be the single worst thing in this codebase.
 */

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS advertising_requests (
       id            SERIAL PRIMARY KEY,
       created_at    TIMESTAMPTZ DEFAULT NOW(),
       status        TEXT DEFAULT 'new',
       company       TEXT NOT NULL,
       contact_name  TEXT NOT NULL,
       email         TEXT NOT NULL,
       phone         TEXT DEFAULT '',
       website       TEXT DEFAULT '',
       package       TEXT DEFAULT '',
       states        TEXT DEFAULT '',
       budget        TEXT DEFAULT '',
       message       TEXT DEFAULT '',
       from_site     TEXT DEFAULT '',
       admin_notes   TEXT DEFAULT '',
       campaign_id   INTEGER
     )`
  );
  schemaReady = true;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Honeypot: a field hidden from people and filled in by bots. Answer 200
    // so the bot has nothing to learn from being rejected.
    if (body.website_url) {
      return NextResponse.json({ ok: true });
    }

    const company = String(body.company || "").trim();
    const contactName = String(body.contactName || "").trim();
    const email = String(body.email || "").trim();

    if (!company || !contactName || !email) {
      return NextResponse.json(
        { error: "Company, contact name and email are required." },
        { status: 400 }
      );
    }
    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: "That email address is not valid." }, { status: 400 });
    }

    await ensureSchema();

    const host = req.headers.get("host") || "";
    const site = getSiteByDomain(host.split(":")[0].replace(/^www\./, ""));

    // Only keep state names we recognise, so the field stays usable when a
    // campaign is built from it later.
    const validStates = new Set(Object.values(sites).map((s) => s.state));
    const states = Array.isArray(body.states)
      ? body.states.filter((s: unknown) => typeof s === "string" && validStates.has(s))
      : [];

    const { rows } = await pool.query(
      `INSERT INTO advertising_requests
         (company, contact_name, email, phone, website, package, states, budget, message, from_site)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        company.slice(0, 200),
        contactName.slice(0, 200),
        email.slice(0, 200),
        String(body.phone || "").slice(0, 60),
        String(body.website || "").slice(0, 300),
        String(body.package || "").slice(0, 100),
        states.join(", "),
        String(body.budget || "").slice(0, 100),
        String(body.message || "").slice(0, 4000),
        site?.slug || host,
      ]
    );

    return NextResponse.json({
      ok: true,
      requestId: rows[0].id,
      message: "Thank you — we'll be in touch within one business day.",
    });
  } catch (e) {
    console.error("[advertising-request]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please email us instead." },
      { status: 500 }
    );
  }
}

/** Admin: list enquiries. */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSchema();
  const status = req.nextUrl.searchParams.get("status");

  const { rows } = await pool.query(
    `SELECT * FROM advertising_requests
      ${status ? "WHERE status = $1" : ""}
      ORDER BY created_at DESC LIMIT 100`,
    status ? [status] : []
  );

  return NextResponse.json({ count: rows.length, requests: rows });
}
