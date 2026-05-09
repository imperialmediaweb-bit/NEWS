import { NextRequest, NextResponse } from "next/server";
import { FB_OAUTH, FB_PERMISSIONS, getRedirectUri, makeState } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get("admin_token")?.value;
  const adminSecret = process.env.CRON_SECRET || "admin123";
  if (adminCookie !== adminSecret) {
    return NextResponse.redirect(new URL("/admin-login?redirect=/admin/facebook", req.url));
  }

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "FACEBOOK_APP_ID not configured" }, { status: 500 });
  }

  const state = makeState();
  const url = new URL(FB_OAUTH);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", FB_PERMISSIONS.join(","));
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
