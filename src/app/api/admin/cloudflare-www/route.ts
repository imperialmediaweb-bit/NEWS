import { NextRequest, NextResponse } from "next/server";

const RAILWAY_DOMAIN = "news-copy-production-12db.up.railway.app";

export async function POST(req: NextRequest) {
  // Auth check
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("admin_token")?.value;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const cfToken = body.cfToken;
  if (!cfToken) {
    return NextResponse.json({ error: "cfToken required in body" }, { status: 400 });
  }

  const results: { domain: string; status: string; error?: string }[] = [];

  // Step 1: Get all zones from Cloudflare
  const allZones: { id: string; name: string }[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const zonesRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const zonesData = await zonesRes.json();

    if (!zonesData.success) {
      return NextResponse.json({
        error: "Cloudflare API error",
        details: zonesData.errors,
      }, { status: 400 });
    }

    for (const z of zonesData.result || []) {
      allZones.push({ id: z.id, name: z.name });
    }

    const info = zonesData.result_info || {};
    totalPages = Math.ceil((info.total_count || 0) / (info.per_page || 50));
    page++;
  }

  // Step 2: For each zone, delete old www records and create CNAME -> Railway
  for (const zone of allZones) {
    try {
      // Delete any existing www records (A, AAAA, CNAME)
      for (const type of ["A", "AAAA", "CNAME"]) {
        const existingRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=${type}&name=www.${zone.name}`,
          {
            headers: {
              Authorization: `Bearer ${cfToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        const existingData = await existingRes.json();
        for (const record of existingData.result || []) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records/${record.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${cfToken}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      // Create new CNAME www -> Railway
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "CNAME",
            name: "www",
            content: RAILWAY_DOMAIN,
            ttl: 1,
            proxied: true,
          }),
        }
      );
      const createData = await createRes.json();

      if (createData.success) {
        results.push({ domain: zone.name, status: "OK" });
      } else {
        results.push({
          domain: zone.name,
          status: "FAILED",
          error: createData.errors?.[0]?.message || "Unknown error",
        });
      }
    } catch (err) {
      results.push({
        domain: zone.name,
        status: "ERROR",
        error: String(err),
      });
    }
  }

  const ok = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status !== "OK").length;

  return NextResponse.json({
    total: allZones.length,
    ok,
    failed,
    results,
  });
}
