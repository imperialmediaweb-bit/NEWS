import { NextRequest, NextResponse } from "next/server";
import { listSitesWithFbInfo, updateSiteFbMapping } from "@/lib/fb-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const sites = await listSitesWithFbInfo();
  // Don't leak access tokens to the client.
  const safe = sites.map((s) => ({
    id: s.id,
    slug: s.slug,
    domain: s.domain,
    name: s.name,
    fb_page_id: s.fb_page_id,
    fb_page_name: s.fb_page_name,
    fb_posting_enabled: s.fb_posting_enabled,
    fb_last_posted_at: s.fb_last_posted_at,
    has_token: Boolean(s.fb_access_token),
  }));
  return NextResponse.json({ sites: safe });
}

interface SaveBody {
  site_id: number;
  fb_page_id: string | null;
  fb_page_name?: string | null;
  fb_access_token?: string | null;
  enabled: boolean;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SaveBody;
  if (!body || typeof body.site_id !== "number") {
    return NextResponse.json({ error: "site_id required" }, { status: 400 });
  }
  await updateSiteFbMapping(
    body.site_id,
    body.fb_page_id || null,
    body.fb_page_name || null,
    body.fb_access_token || null,
    Boolean(body.enabled)
  );
  return NextResponse.json({ ok: true });
}
