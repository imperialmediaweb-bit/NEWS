import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { saveSubscriber, pushEnabled } from "@/lib/push";

/** Save a reader's push subscription for the paper whose domain they are on. */
export async function POST(req: NextRequest) {
  try {
    if (!pushEnabled()) return NextResponse.json({ error: "off" }, { status: 503 });
    const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
    const site = getSiteByDomain(host);
    if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
    const { subscription } = await req.json();
    const s = subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
    if (!s?.endpoint || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    await saveSubscriber(site.slug, { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, req.headers.get("user-agent"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
