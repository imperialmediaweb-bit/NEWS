import { NextResponse } from "next/server";
import { vapidKeys } from "@/lib/push";

/** The public VAPID key the browser needs to subscribe (public by design). */
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const k = await vapidKeys();
    return NextResponse.json({ key: k.publicKey }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ key: null }, { status: 503 });
  }
}
