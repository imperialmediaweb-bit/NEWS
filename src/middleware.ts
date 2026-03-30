import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware — protects against bots, hackers, and abuse.
 *
 * Features:
 * 1. Rate limiting per IP (in-memory, resets on deploy)
 * 2. Bot/scanner blocking (known bad user agents)
 * 3. Security headers (XSS, clickjacking, MIME sniffing)
 * 4. Block common attack paths (wp-admin, .env, etc.)
 * 5. Admin route protection
 */

// ─── Rate limiting (in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // 120 req/min per IP
const RATE_LIMIT_API_MAX = 30; // 30 req/min for API routes

// ─── Known bad bots / scanners ───
const BAD_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /burpsuite/i,
  /metasploit/i,
  /hydra/i,
  /havij/i,
  /zmeu/i,
  /morfeus/i,
  /papastats/i,
  /python-requests\/[0-9]/i,
  /scrapy/i,
  /wget/i,
  /curl\/[0-9]/i,
];

// ─── Blocked attack paths ───
const BLOCKED_PATHS = [
  "/wp-admin",
  "/wp-login",
  "/wp-content/uploads",
  "/wp-includes",
  "/xmlrpc.php",
  "/.env",
  "/.git",
  "/.htaccess",
  "/config.php",
  "/admin.php",
  "/phpinfo",
  "/phpmyadmin",
  "/pma",
  "/mysql",
  "/wp-config",
  "/backup",
  "/shell",
  "/cmd",
  "/eval",
  "/exec",
  "/.aws",
  "/.docker",
  "/actuator",
  "/api/v1/pods",
  "/debug",
  "/trace",
  "/server-status",
  "/server-info",
  "/.well-known/security.txt",
];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string, isApi: boolean): boolean {
  const now = Date.now();
  const key = isApi ? `api:${ip}` : ip;
  const limit = isApi ? RATE_LIMIT_API_MAX : RATE_LIMIT_MAX_REQUESTS;

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > limit) {
    return true;
  }
  return false;
}

// Clean up stale rate limit entries every 5 minutes
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { _rlCleanup?: boolean };
  if (!g._rlCleanup) {
    g._rlCleanup = true;
    setInterval(() => {
      const now = Date.now();
      const keys = Array.from(rateLimitMap.keys());
      for (const key of keys) {
        const entry = rateLimitMap.get(key);
        if (entry && now > entry.resetAt) {
          rateLimitMap.delete(key);
        }
      }
    }, 300_000);
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = getClientIp(req);

  // ─── 1. Block known bad bots/scanners ───
  for (const pattern of BAD_BOT_PATTERNS) {
    if (pattern.test(ua)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ─── 2. Block attack paths ───
  const lowerPath = pathname.toLowerCase();
  for (const blocked of BLOCKED_PATHS) {
    if (lowerPath.startsWith(blocked)) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  // Block common file extensions used in attacks
  if (/\.(php|asp|aspx|jsp|cgi|sql|bak|swp|old|orig|save)$/i.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // ─── 3. Rate limiting ───
  const isApi = pathname.startsWith("/api/");
  if (isRateLimited(ip, isApi)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  // ─── 4. Admin protection — server-side auth ───
  if (pathname.startsWith("/admin")) {
    const adminSecret = process.env.CRON_SECRET;
    if (adminSecret) {
      // Check cookie or query param for admin auth
      const adminCookie = req.cookies.get("admin_token")?.value;
      const queryKey = req.nextUrl.searchParams.get("key");

      if (adminCookie !== adminSecret && queryKey !== adminSecret) {
        // Not authenticated — show login page
        // If key is provided but wrong, reject
        if (queryKey && queryKey !== adminSecret) {
          return new NextResponse("Forbidden — invalid key", { status: 403 });
        }

        // Redirect to admin login
        const loginUrl = new URL("/admin-login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // If authenticated via query param, set cookie and redirect clean URL
      if (queryKey === adminSecret && adminCookie !== adminSecret) {
        const redirectUrl = new URL(pathname, req.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set("admin_token", adminSecret, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
        return response;
      }
    }
  }

  // ─── 5. Protect admin API routes ───
  if (pathname.startsWith("/api/admin")) {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.nextUrl.searchParams.get("key") ||
      req.cookies.get("admin_token")?.value;
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ─── 5. Pipeline API requires auth ───
  if (pathname.startsWith("/api/pipeline/") && req.method === "POST") {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }
  }

  // ─── 6. Security headers ───
  const response = NextResponse.next();

  // Prevent XSS
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Strict Transport Security (HTTPS only)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Content Security Policy — allow images from Pexels/Unsplash/Pixabay (hotlinking)
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://images.pexels.com https://images.unsplash.com https://pixabay.com https://cdn.pixabay.com https://*.googleusercontent.com",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)",
  ],
};
