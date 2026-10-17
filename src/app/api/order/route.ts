import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { ensureOrdersSchema, newReportToken, clientDomain } from "@/lib/orders-schema";

export const dynamic = "force-dynamic";

/**
 * Public order endpoint — a client ordering a campaign from the website.
 *
 * It creates the order and stops there. Nothing is published, and the order is
 * marked unpaid and pending review. A public endpoint that could put text on
 * forty-nine news sites without a person looking at it first would be the
 * single most dangerous thing in this codebase: anyone could aim the whole
 * network at anything.
 *
 * Publishing is /api/admin/orders/publish, which needs the admin key.
 */

/**
 * Not exported: a Next.js route file may only export its handlers and a fixed
 * set of config values.
 */
const PACKAGES: Record<string, { label: string; sites: number; price: number }> = {
  network: { label: "Network campaign — 49 newspapers", sites: 49, price: 149 },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Honeypot: hidden from people, filled in by bots. Answer 200 so a bot
    // learns nothing from being refused.
    if (body.website_url) return NextResponse.json({ ok: true });

    const client = String(body.company || "").trim();
    const contact = String(body.contactName || "").trim();
    const email = String(body.email || "").trim();
    const clientUrl = String(body.clientUrl || "").trim();

    if (!client || !contact || !email || !clientUrl) {
      return NextResponse.json(
        { error: "Company, your name, email and the link you want promoted are all required." },
        { status: 400 }
      );
    }
    if (!EMAIL.test(email)) {
      return NextResponse.json({ error: "That email address is not valid." }, { status: 400 });
    }
    if (!clientDomain(clientUrl)) {
      return NextResponse.json(
        { error: "That doesn't look like a valid link — include the full address." },
        { status: 400 }
      );
    }

    const pkg = PACKAGES[String(body.package || "network")] || PACKAGES.network;

    await ensureOrdersSchema();

    const host = req.headers.get("host") || "";
    const site = getSiteByDomain(host.split(":")[0].replace(/^www\./, ""));

    const { rows } = await pool.query(
      `INSERT INTO orders
         (client, email, phone, client_url, package, price, currency, paid,
          title, material, notes, status, token)
       VALUES ($1,$2,$3,$4,$5,$6,'USD',FALSE,$7,$8,$9,'pending_review',$10)
       RETURNING id, token`,
      [
        client.slice(0, 200),
        email.slice(0, 200),
        String(body.phone || "").slice(0, 60),
        clientUrl.slice(0, 500),
        pkg.label,
        pkg.price,
        String(body.title || "").slice(0, 300) || null,
        String(body.material || "").slice(0, 20000) || null,
        `Contact: ${contact}${site ? ` · ordered from ${site.slug}` : ""}`.slice(0, 500),
        newReportToken(),
      ]
    );

    return NextResponse.json({
      ok: true,
      orderId: rows[0].id,
      // The client gets their report link straight away. It is empty until
      // publishing starts, and fills in as each site goes live — which is a
      // better answer to "has it gone out yet?" than an email exchange.
      reportUrl: `/report/${rows[0].token}`,
      message:
        "Thank you. We'll review your order and email you an invoice before anything is published.",
    });
  } catch (e) {
    console.error("[order]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please email us instead." },
      { status: 500 }
    );
  }
}
