import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain, sites } from "@/config/sites";
import { sendToAll } from "@/lib/push";

/**
 * Manual send (admin): POST { title, body?, url, image?, site? | hostname? }
 * to every subscriber of one paper, or of every paper when none is given.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.title || !b.url) return NextResponse.json({ error: "title and url required" }, { status: 400 });
  const one = b.site ? sites[b.site] : b.hostname ? getSiteByDomain(String(b.hostname).replace(/^www\./, "")) : null;
  const targets = one ? [one] : Object.values(sites);
  const results = [];
  for (const s of targets) {
    const url = /^https?:\/\//.test(b.url) ? b.url : `https://${s.domain}${b.url.startsWith("/") ? "" : "/"}${b.url}`;
    results.push({ site: s.slug, ...(await sendToAll(s.slug, { title: String(b.title).slice(0, 90), body: b.body || "", url, image: b.image || undefined, icon: `https://${s.domain}/api/favicon?site=${s.slug}` }, { manual: true })) });
  }
  return NextResponse.json({ results });
}
