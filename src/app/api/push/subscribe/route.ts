import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Store push notification subscriptions.
 * Creates table if not exists.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, hostname } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        keys_p256dh TEXT,
        keys_auth TEXT,
        hostname TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(
      `INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth, hostname)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         keys_p256dh = $2, keys_auth = $3, hostname = $4`,
      [
        subscription.endpoint,
        subscription.keys?.p256dh || "",
        subscription.keys?.auth || "",
        hostname || "",
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
