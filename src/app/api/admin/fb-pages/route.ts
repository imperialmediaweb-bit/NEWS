import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Returns the pages fetched during the OAuth callback (stored in HTTP-only cookie).
export async function GET(req: NextRequest) {
  const raw = req.cookies.get("fb_pages")?.value;
  if (!raw) return NextResponse.json({ pages: [] });
  try {
    const pages = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ pages: [] });
  }
}
