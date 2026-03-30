import { NextRequest, NextResponse } from "next/server";

/**
 * Setup www -> non-www 301 redirect via Cloudflare Redirect Rules (free tier).
 * Uses the newer Rulesets API instead of legacy Page Rules.
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
      // Step 1: Ensure www DNS record exists (needed for Cloudflare to handle the request)
      // Create a proxied CNAME www -> root domain (Cloudflare intercepts before reaching Railway)
      let hasWwwDns = false;
      for (const type of ["A", "AAAA", "CNAME"]) {
        const existRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=${type}&name=www.${zone.name}`,
          { headers: cfHeaders }
        );
        const existData = await existRes.json();
        if ((existData.result || []).length > 0) {
          hasWwwDns = true;
          // Make sure it's proxied (orange cloud) so Cloudflare can redirect
          for (const rec of existData.result) {
            if (!rec.proxied) {
              await fetch(
                `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records/${rec.id}`,
                {
                  method: "PATCH",
                  headers: cfHeaders,
                  body: JSON.stringify({ proxied: true }),
                }
              );
            }
          }
        }
      }

      if (!hasWwwDns) {
        // Create proxied CNAME www -> root (Cloudflare handles redirect before Railway)
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

      // Step 2: Create redirect rule using Rulesets API
      // First, check existing redirect rules
      const rulesetsRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets?phase=http_request_dynamic_redirect`,
        { headers: cfHeaders }
      );
      const rulesetsData = await rulesetsRes.json();

      // Check if www redirect rule already exists in any ruleset
      let ruleExists = false;
      for (const rs of rulesetsData.result || []) {
        if (rs.phase === "http_request_dynamic_redirect") {
          const rsDetailRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${rs.id}`,
            { headers: cfHeaders }
          );
          const rsDetail = await rsDetailRes.json();
          for (const rule of rsDetail.result?.rules || []) {
            if (rule.description?.includes("www redirect") || rule.expression?.includes("www.")) {
              ruleExists = true;
              break;
            }
          }
        }
      }

      if (ruleExists) {
        results.push({ domain: zone.name, status: "OK", detail: "Rule already exists" });
        continue;
      }

      // Create or update the redirect ruleset
      const rulesetPayload = {
        name: "www to non-www redirect",
        kind: "zone",
        phase: "http_request_dynamic_redirect",
        rules: [
          {
            expression: `(http.host eq "www.${zone.name}")`,
            description: "www redirect to non-www",
            action: "redirect",
            action_parameters: {
              from_value: {
                status_code: 301,
                target_url: {
                  expression: `concat("https://${zone.name}", http.request.uri.path)`,
                },
                preserve_query_string: true,
              },
            },
          },
        ],
      };

      // Try to find existing ruleset to update, or create new
      let rulesetId = "";
      for (const rs of rulesetsData.result || []) {
        if (rs.phase === "http_request_dynamic_redirect") {
          rulesetId = rs.id;
          break;
        }
      }

      let ruleRes;
      if (rulesetId) {
        // Add rule to existing ruleset
        ruleRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${rulesetId}/rules`,
          {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify(rulesetPayload.rules[0]),
          }
        );
      } else {
        // Create new ruleset with the rule
        ruleRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
          {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify(rulesetPayload),
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
          detail: ruleData.errors?.[0]?.message || JSON.stringify(ruleData.errors),
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
