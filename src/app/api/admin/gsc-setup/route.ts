import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getGoogleAccessToken } from "@/lib/google-auth";
import { getZoneMap, upsertTxtRecord, hasCloudflareCredentials } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Create and verify a Search Console *domain* property for every site, using
 * the Site Verification API plus Cloudflare DNS.
 *
 * Doing this by hand is 47 properties × (add, verify, grant access). It also
 * keeps going wrong the same way: the properties that do exist are URL-prefix
 * properties on the www host, and middleware 301s every www request to the
 * bare domain, so those properties measure redirects and nothing else. A
 * domain (sc-domain:) property covers www, non-www, http and https at once,
 * which removes that whole class of mistake.
 *
 * DNS propagation means this cannot be one call:
 *
 *   POST /api/admin/gsc-setup?key=CRON_SECRET&step=dns
 *        asks Google for each verification token and writes the TXT records.
 *
 *   ...wait a few minutes...
 *
 *   POST /api/admin/gsc-setup?key=CRON_SECRET&step=verify
 *        verifies each domain, adds the property, and grants `owner` access.
 *
 * Run step=verify again for anything that reports a DNS error — the records
 * are already in place, so it is safe to repeat.
 *
 * Required scopes on the service account:
 *   https://www.googleapis.com/auth/siteverification
 *   https://www.googleapis.com/auth/webmasters
 *
 * The properties end up owned by the service account. Pass `&owner=<email>`
 * to also add a human owner, otherwise they won't appear in anyone's
 * Search Console UI.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

export async function POST(req: NextRequest) {
  return handle(req);
}

// Convenience: this is easier to trigger from a browser than a POST.
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const step = req.nextUrl.searchParams.get("step") || "dns";
  if (step !== "dns" && step !== "verify") {
    return NextResponse.json({ error: "step must be 'dns' or 'verify'" }, { status: 400 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !privateKey) {
    return NextResponse.json(
      { error: "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY are required" },
      { status: 400 }
    );
  }

  if (step === "dns" && !hasCloudflareCredentials()) {
    return NextResponse.json(
      {
        error:
          "No Cloudflare credentials. Set CLOUDFLARE_API_TOKEN (a scoped token with Zone:DNS:Edit), or CLOUDFLARE_EMAIL + CLOUDFLARE_GLOBAL_API_KEY.",
      },
      { status: 400 }
    );
  }

  let token: string;
  try {
    token = await getGoogleAccessToken(email, privateKey, SCOPES);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Google auth failed",
        hint: "Enable both the Site Verification API and the Search Console API in Google Cloud for this project.",
      },
      { status: 500 }
    );
  }

  const onlySlug = req.nextUrl.searchParams.get("site");
  const ownerEmail = req.nextUrl.searchParams.get("owner");
  const targets = onlySlug
    ? Object.values(sites).filter((s) => s.slug === onlySlug)
    : Object.values(sites);

  const zones = step === "dns" ? await getZoneMap() : new Map<string, string>();
  const results: Record<string, unknown>[] = [];

  for (const site of targets) {
    const domain = site.domain.toLowerCase();
    try {
      if (step === "dns") {
        results.push(await prepareDns(token, site.slug, domain, zones));
      } else {
        results.push(await verifyAndAdd(token, site.slug, domain, ownerEmail));
      }
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
        ? "Wait ~5 minutes for DNS to propagate, then call the same URL with step=verify"
        : "Call /api/admin/gsc-list-missing to confirm, then submit sitemaps",
    results,
  });
}

/** Step 1: get the token Google wants in DNS, and write it to Cloudflare. */
async function prepareDns(
  token: string,
  slug: string,
  domain: string,
  zones: Map<string, string>
): Promise<Record<string, unknown>> {
  const zoneId = zones.get(domain);
  if (!zoneId) {
    return {
      site: slug,
      domain,
      ok: false,
      error: "Domain is not a zone on this Cloudflare account — add the TXT record manually",
    };
  }

  const res = await fetch("https://www.googleapis.com/siteVerification/v1/token", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      site: { type: "INET_DOMAIN", identifier: domain },
      verificationMethod: "DNS_TXT",
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    return { site: slug, domain, ok: false, error: `getToken: HTTP ${res.status} ${await res.text()}` };
  }

  const { token: dnsToken } = (await res.json()) as { token: string };
  const dns = await upsertTxtRecord(zoneId, domain, dnsToken);

  return {
    site: slug,
    domain,
    ok: dns.ok,
    ...(dns.alreadyExisted && { note: "TXT record already present" }),
    ...(dns.error && { error: dns.error }),
  };
}

/** Step 2: verify ownership, register the property, optionally add a human owner. */
async function verifyAndAdd(
  token: string,
  slug: string,
  domain: string,
  ownerEmail: string | null
): Promise<Record<string, unknown>> {
  const verifyRes = await fetch(
    "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site: { type: "INET_DOMAIN", identifier: domain } }),
      signal: AbortSignal.timeout(20000),
    }
  );

  let verified = verifyRes.ok;
  let verifyError: string | undefined;
  let resourceId: string | undefined;

  if (verifyRes.ok) {
    const body = (await verifyRes.json()) as { id?: string };
    resourceId = body.id;
  } else {
    const text = await verifyRes.text();
    // Already verified by this account is a success, not a failure.
    if (verifyRes.status === 400 && /already verified/i.test(text)) {
      verified = true;
      resourceId = `INET_DOMAIN:${domain}`;
    } else {
      verifyError = `verify: HTTP ${verifyRes.status} ${text.slice(0, 300)}`;
    }
  }

  if (!verified) {
    return { site: slug, domain, ok: false, error: verifyError };
  }

  // Register the domain property in Search Console.
  const property = `sc-domain:${domain}`;
  const addRes = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    }
  );

  const added = addRes.ok;
  const addError = added ? undefined : `addSite: HTTP ${addRes.status} ${(await addRes.text()).slice(0, 300)}`;

  // Without a human owner the property exists only for the service account and
  // never shows up in the Search Console interface.
  let ownerAdded: boolean | undefined;
  let ownerError: string | undefined;
  if (ownerEmail && resourceId) {
    const ownerRes = await fetch(
      `https://www.googleapis.com/siteVerification/v1/webResource/${encodeURIComponent(resourceId)}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resourceId,
          site: { type: "INET_DOMAIN", identifier: domain },
          owners: [ownerEmail],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    ownerAdded = ownerRes.ok;
    if (!ownerRes.ok) ownerError = `addOwner: HTTP ${ownerRes.status} ${(await ownerRes.text()).slice(0, 200)}`;
  }

  return {
    site: slug,
    domain,
    property,
    ok: added,
    verified,
    ...(ownerAdded !== undefined && { ownerAdded }),
    ...(addError && { error: addError }),
    ...(ownerError && { ownerError }),
  };
}
