import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { submitToIndexNow } from "@/lib/indexnow";
import { citiesOf } from "@/lib/local-data";
import { specialPagesFor } from "@/config/special-pages";

/**
 * Announce the network's standing pages (weather, gas, things to do, alerts,
 * submit, promote, obituaries) to Bing/Yandex via IndexNow on every site.
 *   GET /api/admin/ping-new-pages?key=CRON_SECRET
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let ok = 0;
  const failed: string[] = [];
  for (const s of Object.values(sites)) {
    const base = `https://${s.domain}`;
    const urls = ["/gas-prices", "/things-to-do", "/alerts", "/submit", "/promote", "/obituaries/submit"].map((p) => base + p)
      .concat(citiesOf(s.state).map(([c]) => `${base}/weather/${slug(c)}`))
      .concat(specialPagesFor(s.stateAbbr).map((p) => base + p));
    if (await submitToIndexNow(s.domain, urls)) ok++;
    else failed.push(s.domain);
  }
  return NextResponse.json({ ok, failed });
}
