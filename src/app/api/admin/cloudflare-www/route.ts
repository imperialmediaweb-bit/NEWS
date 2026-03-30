import { NextRequest, NextResponse } from "next/server";

/**
 * Setup www -> non-www 301 redirect via Cloudflare Single Redirect Rules.
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

  const cfHeaders = { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" };
  const results: { domain: string; status: string; detail?: string }[] = [];

  // Get all zones
  const allZones: { id: string; name: string }[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`,
      { headers: cfHeaders }
    );
    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ error: "Cloudflare API error", details: data.errors }, { status: 400 });
    }
    for (const z of data.result || []) {
      allZones.push({ id: z.id, name: z.name });
    }
    const info = data.result_info || {};
    totalPages = Math.ceil((info.total_count || 0) / (info.per_page || 50));
    page++;
  }

  for (const zone of allZones) {
    try {
      // Step 1: Ensure www DNS record exists (proxied so Cloudflare handles it)
      let hasWwwDns = false;
      for (const type of ["A", "AAAA", "CNAME"]) {
        const existRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=${type}&name=www.${zone.name}`,
          { headers: cfHeaders }
        );
        const existData = await existRes.json();
        if ((existData.result || []).length > 0) {
          hasWwwDns = true;
          // Ensure proxied
          for (const rec of existData.result) {
            if (!rec.proxied) {
              await fetch(
                `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records/${rec.id}`,
                { method: "PATCH", headers: cfHeaders, body: JSON.stringify({ proxied: true }) }
              );
            }
          }
        }
      }

      if (!hasWwwDns) {
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
          {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify({
              type: "CNAME",
              name: "www",
              content: zone.name,
              ttl: 1,
              proxied: true,
            }),
          }
        );
      }

      // Step 2: Create Single Redirect rule (phase: http_request_redirect)
      // Check if ruleset exists for this phase
      const rulesetsRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
        { headers: cfHeaders }
      );
      const rulesetsData = await rulesetsRes.json();

      let redirectRulesetId = "";
      for (const rs of rulesetsData.result || []) {
        if (rs.phase === "http_request_redirect") {
          redirectRulesetId = rs.id;
          break;
        }
      }

      // Check if www rule already exists
      if (redirectRulesetId) {
        const rsRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${redirectRulesetId}`,
          { headers: cfHeaders }
        );
        const rsData = await rsRes.json();
        const hasWwwRule = (rsData.result?.rules || []).some(
          (r: { expression?: string }) => r.expression?.includes("www.")
        );
        if (hasWwwRule) {
          results.push({ domain: zone.name, status: "OK", detail: "Rule already exists" });
          continue;
        }
      }

      const redirectRule = {
        expression: `(http.host eq "www.${zone.name}")`,
        description: "www redirect to non-www",
        action: "redirect",
        action_parameters: {
          from_value: {
            status_code: 301,
            target_url: {
              value: `https://${zone.name}`,
            },
            preserve_query_string: true,
          },
        },
      };

      let ruleRes;
      if (redirectRulesetId) {
        // Add rule to existing ruleset
        ruleRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${redirectRulesetId}/rules`,
          { method: "POST", headers: cfHeaders, body: JSON.stringify(redirectRule) }
        );
      } else {
        // Create new ruleset
        ruleRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
          {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify({
              name: "www redirect",
              kind: "zone",
              phase: "http_request_redirect",
              rules: [redirectRule],
            }),
          }
        );
      }

      const ruleData = await ruleRes.json();
      if (ruleData.success) {
        results.push({ domain: zone.name, status: "OK", detail: "Redirect rule created" });
      } else {
        results.push({
          domain: zone.name,
          status: "FAILED",
          detail: ruleData.errors?.[0]?.message || JSON.stringify(ruleData.errors?.slice(0, 2)),
        });
      }
    } catch (err) {
      results.push({ domain: zone.name, status: "ERROR", detail: String(err) });
    }
  }

  const ok = results.filter((r) => r.status === "OK").length;
  const failed = results.filter((r) => r.status !== "OK").length;

  return NextResponse.json({ total: allZones.length, ok, failed, results });
}
