import { NextRequest, NextResponse } from "next/server";

function authCheck(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key");
  return token === process.env.CRON_SECRET;
}

/**
 * Debug endpoint — test what Google News RSS actually returns.
 * GET /api/pipeline/debug-rss?key=SECRET&state=California
 */
export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = req.nextUrl.searchParams.get("state") || "California";
  const query = `${state} news`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    // Try with browser-like headers
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const status = res.status;
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });

    const text = await res.text();

    // Count <item> tags
    const itemCount = (text.match(/<item>/g) || []).length;
    const titleMatches = text.match(/<title>([^<]+)<\/title>/g) || [];
    const titles = titleMatches.slice(0, 10).map((t: string) =>
      t.replace(/<\/?title>/g, "")
    );

    return NextResponse.json({
      url,
      status,
      responseHeaders: headers,
      contentLength: text.length,
      itemCount,
      first10Titles: titles,
      rawFirst500: text.slice(0, 500),
      rawLast500: text.slice(-500),
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      url,
    });
  }
}
