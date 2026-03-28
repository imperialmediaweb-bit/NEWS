import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSiteByDomain } from "@/config/sites";
import { generateIndexNowKey } from "@/lib/indexnow";

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const siteConfig = getSiteByDomain(host);
  const domain = siteConfig?.domain || host.replace(/:\d+$/, "");
  const key = generateIndexNowKey(domain);

  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
