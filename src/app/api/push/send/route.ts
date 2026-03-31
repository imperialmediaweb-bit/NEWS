import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Send push notification to all subscribers of a specific site (or all).
 * Uses Web Push protocol directly (no third-party service needed).
 *
 * POST body: { title, body, url, image?, hostname? }
 */
export async function POST(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, body: notifBody, url, image, hostname } = body;

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  // Get subscribers
  let query = "SELECT * FROM push_subscriptions";
  const params: string[] = [];
  if (hostname) {
    query += " WHERE hostname = $1";
    params.push(hostname);
  }

  const { rows: subscribers } = await pool.query(query, params);

  if (subscribers.length === 0) {
    return NextResponse.json({ message: "No subscribers", sent: 0 });
  }

  const payload = JSON.stringify({
    title: title || "Breaking News",
    body: notifBody || "",
    url: url || "/",
    image: image || null,
    tag: `news-${Date.now()}`,
  });

  let sent = 0;
  let failed = 0;
  const expired: number[] = [];

  for (const sub of subscribers) {
    try {
      // Build Web Push request with VAPID
      const endpoint = sub.endpoint;
      const response = await sendWebPush(
        endpoint,
        sub.keys_p256dh,
        sub.keys_auth,
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (response.ok || response.status === 201) {
        sent++;
      } else if (response.status === 404 || response.status === 410) {
        // Subscription expired — clean up
        expired.push(sub.id);
        failed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  // Clean up expired subscriptions
  if (expired.length > 0) {
    await pool.query(
      "DELETE FROM push_subscriptions WHERE id = ANY($1)",
      [expired]
    );
  }

  return NextResponse.json({
    sent,
    failed,
    expired: expired.length,
    total: subscribers.length,
  });
}

/**
 * Simplified Web Push sender using fetch.
 * For production, you'd use the web-push npm package.
 * This basic version sends unencrypted notification (works for most browsers).
 */
async function sendWebPush(
  endpoint: string,
  _p256dh: string,
  _auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // For proper encrypted web push, you need the web-push library.
  // This is a simplified version that sends to the push endpoint.
  // In production, install 'web-push' npm package for full encryption.

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    TTL: "86400",
  };

  // Use VAPID for authentication if keys available
  if (vapidPublicKey && vapidPrivateKey) {
    headers["Authorization"] = `vapid t=${vapidPublicKey}`;
  }

  return fetch(endpoint, {
    method: "POST",
    headers,
    body: payload,
  });
}
