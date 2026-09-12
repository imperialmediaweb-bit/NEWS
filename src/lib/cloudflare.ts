/**
 * Minimal Cloudflare API client — only what the Search Console setup needs.
 *
 * Auth comes from either a scoped API token (preferred: CLOUDFLARE_API_TOKEN)
 * or the legacy global key pair (CLOUDFLARE_EMAIL + CLOUDFLARE_GLOBAL_API_KEY).
 * A scoped token limited to Zone:DNS:Edit is much safer than the global key,
 * which can do anything to the account.
 */

const API = "https://api.cloudflare.com/client/v4";

function authHeaders(): Record<string, string> | null {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (token) return { Authorization: `Bearer ${token}` };

  const email = process.env.CLOUDFLARE_EMAIL;
  const key = process.env.CLOUDFLARE_GLOBAL_API_KEY;
  if (email && key) return { "X-Auth-Email": email, "X-Auth-Key": key };

  return null;
}

export function hasCloudflareCredentials(): boolean {
  return authHeaders() !== null;
}

interface CfResponse<T> {
  success: boolean;
  errors?: { code: number; message: string }[];
  result?: T;
}

async function cf<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: true; result: T } | { ok: false; error: string }> {
  const headers = authHeaders();
  if (!headers) return { ok: false, error: "No Cloudflare credentials configured" };

  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { ...headers, "Content-Type": "application/json", ...(init.headers || {}) },
      signal: AbortSignal.timeout(15000),
    });
    const body = (await res.json()) as CfResponse<T>;
    if (!body.success) {
      const msg = body.errors?.map((e) => `${e.code}: ${e.message}`).join("; ") || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    return { ok: true, result: body.result as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Cache the zone list — it is the same for every domain we process. */
let zoneCache: { map: Map<string, string>; loadedAt: number } | null = null;
const ZONE_TTL = 10 * 60 * 1000;

/** domain (lowercase) → zone id, for every zone on the account. */
export async function getZoneMap(): Promise<Map<string, string>> {
  if (zoneCache && Date.now() - zoneCache.loadedAt < ZONE_TTL) return zoneCache.map;

  const map = new Map<string, string>();
  for (let page = 1; page <= 10; page++) {
    const res = await cf<{ id: string; name: string }[]>(
      `/zones?page=${page}&per_page=50&status=active`
    );
    if (!res.ok) break;
    for (const zone of res.result) map.set(zone.name.toLowerCase(), zone.id);
    if (res.result.length < 50) break;
  }

  zoneCache = { map, loadedAt: Date.now() };
  return map;
}

/**
 * Create a TXT record, or report it as already present. Cloudflare rejects an
 * exact duplicate, which for our purposes is success, not failure.
 */
export async function upsertTxtRecord(
  zoneId: string,
  name: string,
  content: string
): Promise<{ ok: boolean; error?: string; alreadyExisted?: boolean }> {
  const existing = await cf<{ id: string; content: string }[]>(
    `/zones/${zoneId}/dns_records?type=TXT&name=${encodeURIComponent(name)}`
  );
  if (existing.ok && existing.result.some((r) => r.content === content)) {
    return { ok: true, alreadyExisted: true };
  }

  const created = await cf<{ id: string }>(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify({ type: "TXT", name, content, ttl: 60 }),
  });

  if (!created.ok) return { ok: false, error: created.error };
  return { ok: true };
}
