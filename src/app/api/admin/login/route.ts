import { NextRequest, NextResponse } from "next/server";

// In-memory login attempt tracking
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();

  // Check if IP is blocked
  const attempts = loginAttempts.get(ip);
  if (attempts && now < attempts.blockedUntil) {
    const remainingMin = Math.ceil((attempts.blockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${remainingMin} minutes.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = body.password;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const adminSecret = process.env.CRON_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Constant-time comparison to prevent timing attacks
  const isValid =
    password.length === adminSecret.length &&
    timingSafeEqual(password, adminSecret);

  if (!isValid) {
    // Track failed attempt
    const current = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    current.count++;
    if (current.count >= MAX_ATTEMPTS) {
      current.blockedUntil = now + BLOCK_DURATION;
      current.count = 0;
    }
    loginAttempts.set(ip, current);

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Clear attempts on success
  loginAttempts.delete(ip);

  // Set httpOnly secure cookie — cannot be read by JavaScript
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", adminSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Edge runtime doesn't have crypto.timingSafeEqual, so we implement manually.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
