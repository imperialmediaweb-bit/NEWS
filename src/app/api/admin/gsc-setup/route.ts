import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getZoneMap, hasCloudflareCredentials } from "@/lib/cloudflare";
import { autoSetup, getGscToken, prepareDns, verifyAndAdd } from "@/lib/gsc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Create and verify Search Console *domain* properties for the sites.
 *
 *   ?step=auto    (default) one self-healing pass over everything still
 *                 missing a usable domain property: write the DNS record, then
 *                 try to verify. This is what the hourly cron job calls, so it
 *                 normally needs no manual use at all.
 *   ?step=dns     only write the TXT records
 *   ?step=verify  only verify and register
 *
 * Optional: &site=<slug> for a single site, &owner=<email> to grant a human
 * owner (otherwise GSC_OWNER_EMAIL is used). Without an owner the properties
 * belong to the service account alone and appear in nobody's Search Console.
 *
 * Every step is safe to repeat.
 */
export async function POST(req: NextRequest) {
  return handle(req);
}

// Easier to trigger from a browser than a POST.
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  // Accept either form: ?key= for a browser, Bearer for the cron dispatcher.
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const step = req.nextUrl.searchParams.get("step") || "auto";
  if (!["auto", "dns", "verify"].includes(step)) {
    return NextResponse.json({ error: "step must be auto, dns or verify" }, { status: 400 });
  }

  const onlySlug = req.nextUrl.searchParams.get("site");
  const ownerEmail = req.nextUrl.searchParams.get("owner") || process.env.GSC_OWNER_EMAIL || null;

  try {
    if (step === "auto" && !onlySlug) {
      const report = await autoSetup();
      return NextResponse.json({ step, ...report });
    }

    const targets = onlySlug
      ? Object.values(sites).filter((s) => s.slug === onlySlug)
      : Object.values(sites);

    if (targets.length === 0) {
      return NextResponse.json({ error: `Unknown site: ${onlySlug}` }, { status: 400 });
    }

    const token = await getGscToken();
    const needsDns = step === "dns" || step === "auto";

    if (needsDns && !hasCloudflareCredentials()) {
      return NextResponse.json(
        {
          error:
            "No Cloudflare credentials. Set CLOUDFLARE_API_TOKEN (a scoped token with Zone:DNS:Edit), or CLOUDFLARE_EMAIL + CLOUDFLARE_GLOBAL_API_KEY.",
        },
        { status: 400 }
      );
    }

    const zones = needsDns ? await getZoneMap() : new Map<string, string>();
    const results: Record<string, unknown>[] = [];

    for (const site of targets) {
      const domain = site.domain.toLowerCase();
      try {
        if (needsDns) {
          const dns = await prepareDns(token, domain, zones);
          if (!dns.ok) {
            results.push({ site: site.slug, domain, ok: false, stage: "dns", error: dns.error });
            continue;
          }
          if (step === "dns") {
            results.push({ site: site.slug, domain, stage: "dns", ...dns });
            continue;
          }
        }
        results.push({ site: site.slug, stage: "verify", ...(await verifyAndAdd(token, domain, ownerEmail)) });
      } catch (e) {
        results.push({
          site: site.slug,
          domain,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const ok = results.filter((r) => r.ok).length;
    return NextResponse.json({
      step,
      processed: results.length,
      succeeded: ok,
      failed: results.length - ok,
      nextStep:
        step === "dns"
          ? "Wait ~5 minutes for DNS to propagate, then call with step=verify"
          : "Check /api/pipeline/status",
      results,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : String(e),
        hint: "Enable both the Site Verification API and the Search Console API in Google Cloud for this project.",
      },
      { status: 500 }
    );
  }
}
