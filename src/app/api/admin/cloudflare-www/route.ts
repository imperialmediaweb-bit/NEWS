import { NextRequest, NextResponse } from "next/server";

/**
 * Setup www -> non-www redirect via Cloudflare Redirect Rules.
 *
 * Strategy: Instead of CNAME to Railway (which requires adding www domains on Railway),
 * we use Cloudflare's redirect rules to 301 redirect www to non-www.
 * This way Cloudflare handles the redirect itself — traffic never reaches Railway.
 */
export async function POST(req: NextRequest) {
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

  const results: { domain: string; status: string; detail?: string }[] = [];

  // Get all zones
  const allZones: { id: string; name: string }[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const zonesRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`,
      { headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" } }
    );
    const zonesData = await zonesRes.json();
    if (!zonesData.success) {
      return NextResponse.json({ error: "Cloudflare API error", details: zonesData.errors }, { status: 400 });
    }
    for (const z of zonesData.result || []) {
      allZones.push({ id: z.id, name: z.name });
    }
    const info = zonesData.result_info || {};
    totalPages = Math.ceil((info.total_count || 0) / (info.per_page || 50));
    page++;
  }

  for (const zone of allZones) {
    try {
      // Step 1: Delete existing www DNS records (CNAME to Railway we just created)
      for (const type of ["A", "AAAA", "CNAME"]) {
        const existingRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=${type}&name=www.${zone.name}`,
          { headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" } }
        );
        const existingData = await existingRes.json();
        for (const record of existingData.result || []) {
          await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records/${record.id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${cfToken}` } }
          );
        }
      }

      // Step 2: Create a Page Rule for www redirect: www.domain.com/* -> https://domain.com/$1
      // First check if page rule already exists
      const existingRulesRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone.id}/pagerules?status=active`,
        { headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" } }
      );
      const existingRulesData = await existingRulesRes.json();
      const wwwRuleExists = (existingRulesData.result || []).some(
        (rule: { targets?: { constraint?: { value?: string } }[] }) =>
          rule.targets?.some((t) => t.constraint?.value?.includes(`www.${zone.name}`))
      );

      if (!wwwRuleExists) {
        const ruleRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/pagerules`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              targets: [
                {
                  target: "url",
                  constraint: { operator: "matches", value: `www.${zone.name}/*` },
                },
              ],
              actions: [
                {
                  id: "forwarding_url",
                  value: {
                    url: `https://${zone.name}/$1`,
                    status_code: 301,
                  },
                },
              ],
              priority: 1,
              status: "active",
            }),
          }
        );
        const ruleData = await ruleRes.json();
        if (ruleData.success) {
          results.push({ domain: zone.name, status: "OK", detail: "Page rule created" });
        } else {
          // Page rules might be limited on free plan, try Bulk Redirect as fallback
          results.push({
            domain: zone.name,
            status: "PARTIAL",
            detail: `Page rule failed: ${ruleData.errors?.[0]?.message || "unknown"}. DNS records cleaned.`,
          });
        }
      } else {
        results.push({ domain: zone.name, status: "OK", detail: "Page rule already exists" });
      }
    } catch (err) {
      results.push({ domain: zone.name, status: "ERROR", detail: String(err) });
    }
  }

  const ok = results.filter((r) => r.status === "OK").length;
  const partial = results.filter((r) => r.status === "PARTIAL").length;
  const failed = results.filter((r) => r.status === "ERROR").length;

  return NextResponse.json({ total: allZones.length, ok, partial, failed, results });
}
