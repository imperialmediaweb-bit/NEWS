import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  exchangeForLongLivedUserToken,
  listUserPages,
} from "@/lib/facebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json({ error: "FB app not configured" }, { status: 500 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("fb_oauth_state")?.value;
  if (!code || !state || state !== cookieState) {
    return NextResponse.json({ error: "invalid state or missing code" }, { status: 400 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/admin/fb-oauth/callback`;

  try {
    const short = await exchangeCodeForToken(code, appId, appSecret, redirectUri);
    const long = await exchangeForLongLivedUserToken(short.access_token, appId, appSecret);
    const pages = await listUserPages(long.access_token);

    // Stash pages in a short-lived HTTP-only cookie so the /admin/facebook page can render them.
    // Pages list can be large; cap at what we return to the UI.
    const payload = pages.map((p) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
      category: p.category,
    }));

    const res = NextResponse.redirect(`${req.nextUrl.origin}/admin/facebook?connected=1`);
    res.cookies.set("fb_pages", Buffer.from(JSON.stringify(payload)).toString("base64"), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 1800,
    });
    res.cookies.delete("fb_oauth_state");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
