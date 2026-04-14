import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getOAuthUrl } from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appId = process.env.FB_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "FB_APP_ID not configured" }, { status: 500 });
  }
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/admin/fb-oauth/callback`;
  const state = randomBytes(16).toString("hex");

  const res = NextResponse.redirect(getOAuthUrl(appId, redirectUri, state));
  res.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
