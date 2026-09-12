import { sites } from "@/config/sites";
import { getGoogleAccessToken } from "@/lib/google-auth";
import { getZoneMap, upsertTxtRecord, hasCloudflareCredentials } from "@/lib/cloudflare";

/**
 * Search Console property setup: create and verify a *domain* property for
 * every site, using the Site Verification API and Cloudflare DNS.
 *
 * Domain (sc-domain:) properties cover www, non-www, http and https together.
 * That matters here: the properties that existed before were URL-prefix
 * properties on the www host, and middleware 301s every www request to the
 * bare domain, so they only ever saw redirects.
 *
 * Everything below is idempotent. DNS needs minutes to propagate, so a first
 * pass writes the TXT records and may fail to verify; a later pass verifies.
 * Running this on a schedule converges without anyone watching it.
 */

export const GSC_SCOPES = [
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

export function hasGscCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
}

export async function getGscToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY are required");
  }
  return getGoogleAccessToken(email, privateKey, GSC_SCOPES);
}

export interface Property {
  siteUrl: string;
  permissionLevel: string;
}

/** Every property the service account can see, keyed by bare hostname. */
export async function listProperties(token: string): Promise<Map<string, Property[]>> {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Search Console list failed (${res.status})`);

  const data = (await res.json()) as { siteEntry?: Property[] };
  const byHost = new Map<string, Property[]>();

  for (const entry of data.siteEntry || []) {
    const host = normaliseProperty(entry.siteUrl || "");
    if (!host) continue;
    const list = byHost.get(host) || [];
    list.push({ siteUrl: entry.siteUrl, permissionLevel: entry.permissionLevel || "unknown" });
    byHost.set(host, list);
  }
  return byHost;
}

/** Reduce any property identifier to a bare hostname. */
export function normaliseProperty(siteUrl: string): string | null {
  if (siteUrl.startsWith("sc-domain:")) {
    return siteUrl.slice("sc-domain:".length).toLowerCase();
  }
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

const OWNER_LEVELS = new Set(["siteOwner", "siteFullUser", "siteRestrictedUser"]);

/** A domain property the account can actually read — the only kind that counts. */
export function hasUsableDomainProperty(props: Property[] | undefined): boolean {
  if (!props) return false;
  return props.some(
    (p) => p.siteUrl.startsWith("sc-domain:") && OWNER_LEVELS.has(p.permissionLevel)
  );
}

/** Ask Google for the verification token and write it to Cloudflare DNS. */
export async function prepareDns(
  token: string,
  domain: string,
  zones: Map<string, string>
): Promise<{ ok: boolean; note?: string; error?: string }> {
  const zoneId = zones.get(domain);
  if (!zoneId) {
    return {
      ok: false,
      error: "Domain is not a zone on this Cloudflare account — add the TXT record by hand",
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
    return { ok: false, error: `getToken: HTTP ${res.status} ${(await res.text()).slice(0, 200)}` };
  }

  const { token: dnsToken } = (await res.json()) as { token: string };
  const dns = await upsertTxtRecord(zoneId, domain, dnsToken);
  return {
    ok: dns.ok,
    ...(dns.alreadyExisted && { note: "TXT record already present" }),
    ...(dns.error && { error: dns.error }),
  };
}

/** Verify ownership, register the domain property, optionally add a human owner. */
export async function verifyAndAdd(
  token: string,
  domain: string,
  ownerEmail?: string | null
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
  let resourceId: string | undefined;
  let verifyError: string | undefined;

  if (verifyRes.ok) {
    resourceId = ((await verifyRes.json()) as { id?: string }).id;
  } else {
    const text = await verifyRes.text();
    // Already verified by this account is success, not failure.
    if (/already verified/i.test(text)) {
      verified = true;
      resourceId = `INET_DOMAIN:${domain}`;
    } else {
      verifyError = `verify: HTTP ${verifyRes.status} ${text.slice(0, 250)}`;
    }
  }

  if (!verified) return { domain, ok: false, verified: false, error: verifyError };

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
  const addError = added
    ? undefined
    : `addSite: HTTP ${addRes.status} ${(await addRes.text()).slice(0, 250)}`;

  // Without a human owner the property belongs to the service account alone
  // and never appears in anyone's Search Console interface.
  let ownerAdded: boolean | undefined;
  let ownerError: string | undefined;
  if (ownerEmail && resourceId) {
    const result = await addOwner(token, resourceId, domain, ownerEmail);
    ownerAdded = result.ok;
    ownerError = result.error;
  }

  return {
    domain,
    property,
    ok: added,
    verified: true,
    ...(ownerAdded !== undefined && { ownerAdded }),
    ...(addError && { error: addError }),
    ...(ownerError && { ownerError }),
  };
}

/**
 * Add a person as an owner of a verified property.
 *
 * The owners list is replaced wholesale by this endpoint, so it has to be read
 * first and the new address appended. Sending just the new owner drops the
 * service account, and Google refuses that outright:
 *   "You cannot use Update to unverify your site ownership."
 */
async function addOwner(
  token: string,
  resourceId: string,
  domain: string,
  ownerEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://www.googleapis.com/siteVerification/v1/webResource/${encodeURIComponent(resourceId)}`;

  let owners: string[] = [];
  try {
    const getRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    if (getRes.ok) {
      owners = ((await getRes.json()) as { owners?: string[] }).owners || [];
    }
  } catch {
    // Fall through — an empty list below still includes the new owner, and the
    // PUT will simply fail the same way it would have anyway.
  }

  if (owners.some((o) => o.toLowerCase() === ownerEmail.toLowerCase())) {
    return { ok: true };
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: resourceId,
      site: { type: "INET_DOMAIN", identifier: domain },
      owners: [...owners, ownerEmail],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (res.ok) return { ok: true };
  return { ok: false, error: `addOwner: HTTP ${res.status} ${(await res.text()).slice(0, 200)}` };
}

export interface AutoSetupReport {
  skipped?: string;
  alreadyDone?: boolean;
  remaining: number;
  attempted: number;
  completed: number;
  results: Record<string, unknown>[];
}

/**
 * One self-healing pass: for every site without a usable domain property,
 * write the DNS record and try to verify. Called on a schedule, so a site
 * whose DNS had not propagated on this pass is simply picked up on the next.
 */
export async function autoSetup(options: { limit?: number } = {}): Promise<AutoSetupReport> {
  const empty = { remaining: 0, attempted: 0, completed: 0, results: [] };

  if (!hasGscCredentials()) {
    return { ...empty, skipped: "No Google service-account credentials" };
  }
  if (!hasCloudflareCredentials()) {
    return { ...empty, skipped: "No Cloudflare credentials (CLOUDFLARE_API_TOKEN)" };
  }

  const token = await getGscToken();
  const existing = await listProperties(token);

  const pending = Object.values(sites).filter(
    (s) => !hasUsableDomainProperty(existing.get(s.domain.toLowerCase()))
  );

  if (pending.length === 0) {
    return { ...empty, alreadyDone: true };
  }

  const batch = pending.slice(0, options.limit ?? 50);
  const zones = await getZoneMap();
  const ownerEmail = process.env.GSC_OWNER_EMAIL || null;
  const results: Record<string, unknown>[] = [];

  // Write every DNS record first, then verify. Google fetches the TXT record
  // through its own resolver, which will not see a record written a second
  // earlier — doing all the writes up front gives the earlier domains the time
  // the later ones spend being written. Anything still not visible is simply
  // retried on the next hourly pass.
  const written: { slug: string; domain: string }[] = [];
  for (const site of batch) {
    const domain = site.domain.toLowerCase();
    const dns = await prepareDns(token, domain, zones);
    if (dns.ok) {
      written.push({ slug: site.slug, domain });
    } else {
      results.push({ site: site.slug, domain, ok: false, stage: "dns", error: dns.error });
    }
  }

  for (const { slug, domain } of written) {
    try {
      const verified = await verifyAndAdd(token, domain, ownerEmail);
      results.push({ site: slug, stage: "verify", ...verified });
    } catch (e) {
      results.push({
        site: slug,
        domain,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    remaining: pending.length,
    attempted: batch.length,
    completed: results.filter((r) => r.ok).length,
    results,
  };
}
