import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Setup www -> non-www 301 redirect via Cloudflare Single Redirect Rules.
 * Processes in background (fire-and-forget) to avoid Railway timeout.
 *
 * POST — start the process (returns immediately)
 * GET  — check results
 */

async function processZones(cfToken: string) {
  const cfHeaders = { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" };
  const results: { domain: string; status: string; detail?: string }[] = [];

  try {
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
        console.error("CF zones error:", data.errors);
        return;
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
        // Step 1: Ensure www DNS record exists (proxied)
        let hasWwwDns = false;
        for (const type of ["A", "AAAA", "CNAME"]) {
          const existRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?type=${type}&name=www.${zone.name}`,
            { headers: cfHeaders }
          );
          const existData = await existRes.json();
          if ((existData.result || []).length > 0) {
            hasWwwDns = true;
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

        // Step 2: Create Single Redirect rule
        const rulesetsRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
          { headers: cfHeaders }
        );
        const rulesetsData = await rulesetsRes.json();

        let redirectRulesetId = "";
        for (const rs of rulesetsData.result || []) {
          if (rs.phase === "http_request_dynamic_redirect") {
            redirectRulesetId = rs.id;
            break;
          }
        }

        // Delete old www rules that don't preserve path
        if (redirectRulesetId) {
          const rsRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${redirectRulesetId}`,
            { headers: cfHeaders }
          );
          const rsData = await rsRes.json();
          const wwwRules = (rsData.result?.rules || []).filter(
            (r: { expression?: string }) => r.expression?.includes("www.")
          );
          // Delete old rules
          for (const oldRule of wwwRules) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${redirectRulesetId}/rules/${oldRule.id}`,
              { method: "DELETE", headers: cfHeaders }
            );
          }
          // Re-fetch ruleset ID since deleting all rules may delete the ruleset
          const rsCheck = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
            { headers: cfHeaders }
          );
          const rsCheckData = await rsCheck.json();
          redirectRulesetId = "";
          for (const rs of rsCheckData.result || []) {
            if (rs.phase === "http_request_dynamic_redirect") {
              redirectRulesetId = rs.id;
              break;
            }
          }
        }

        // New rule with dynamic expression that preserves full path + query
        const redirectRule = {
          expression: `(http.host eq "www.${zone.name}")`,
          description: "www redirect to non-www with full path",
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
        };

        let ruleRes;
        if (redirectRulesetId) {
          ruleRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets/${redirectRulesetId}/rules`,
            { method: "POST", headers: cfHeaders, body: JSON.stringify(redirectRule) }
          );
        } else {
          ruleRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zone.id}/rulesets`,
            {
              method: "POST",
              headers: cfHeaders,
              body: JSON.stringify({
                name: "www redirect",
                kind: "zone",
                phase: "http_request_dynamic_redirect",
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

    // Save results to DB
    const ok = results.filter((r) => r.status === "OK").length;
    const failed = results.filter((r) => r.status !== "OK").length;
    const summary = { total: allZones.length, ok, failed, results, completedAt: new Date().toISOString() };

    await pool.query(
      `INSERT INTO pipeline_config (key, value) VALUES ('cloudflare_www_results', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify(summary)]
    );

    console.log(`[cloudflare-www] Done: ${ok} OK, ${failed} failed out of ${allZones.length}`);
  } catch (err) {
    console.error("[cloudflare-www] Fatal error:", err);
  }
}

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

  // Fire and forget — process in background
  processZones(cfToken).catch((err) => console.error("[cloudflare-www] Error:", err));

  return NextResponse.json({
    message: "Processing started. Check GET /api/admin/cloudflare-www for results in 2-3 minutes.",
  });
}

export async function GET(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.cookies.get("admin_token")?.value;
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT value FROM pipeline_config WHERE key = 'cloudflare_www_results'"
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: "No results yet. Run POST first." });
    }
    return NextResponse.json(JSON.parse(rows[0].value));
  } catch {
    return NextResponse.json({ message: "No results yet." });
  }
}
