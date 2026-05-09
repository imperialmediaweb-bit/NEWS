import { NextRequest, NextResponse } from "next/server";
import {
  ensureSchema,
  exchangeCodeForUserToken,
  exchangeForLongLivedToken,
  fetchUserPages,
  savePages,
  verifyState,
} from "@/lib/facebook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getPublicBase(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return `${proto}://${host}`;
}

function redirectTo(req: NextRequest, params: Record<string, string>): NextResponse {
  const base = getPublicBase(req);
  const url = new URL("/admin/facebook", base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url.toString());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  if (error) {
    return redirectTo(req, { error: errorDesc || error });
  }

  if (!code || !state || !verifyState(state)) {
    return redirectTo(req, { error: "Invalid state — încearcă din nou." });
  }

  try {
    await ensureSchema();
    const shortToken = await exchangeCodeForUserToken(code);
    const longToken = await exchangeForLongLivedToken(shortToken);
    const pages = await fetchUserPages(longToken);
    const saved = await savePages(pages);

    return redirectTo(req, { connected: String(saved) });
  } catch (e) {
    return redirectTo(req, { error: e instanceof Error ? e.message : "Eroare necunoscută" });
  }
}
