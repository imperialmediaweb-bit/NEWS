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
 * Drop specific URLs from the edge cache.
 *
 * Article pages are cached for a day, so a page deleted from the database goes
 * on being served from Cloudflare long after it is gone from the site — which
 * is exactly wrong when the reason for deleting it was that someone asked for
 * it to be taken down.
 *
 * Needs Zone:Cache Purge on the token. A token with only Zone:DNS:Edit gets
 * "Authentication error" here, so the failure is reported rather than
 * swallowed: silently not purging is the same as not deleting.
 */
export async function purgeUrls(
  zoneId: string,
  urls: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (urls.length === 0) return { ok: true };
  const res = await cf<{ id: string }>(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ files: urls.slice(0, 30) }),
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
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

/** Drop everything a zone has cached (after a site-wide redesign). Needs Zone:Cache Purge. */
export async function purgeEverything(zoneId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await cf<{ id: string }>(`/zones/${zoneId}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ purge_everything: true }),
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

/**
 * Let AI answer engines (Perplexity, Gemini) reach a zone: turn off Cloudflare's
 * blanket "Block AI bots" and its managed robots.txt, so the app's own robots.txt
 * and middleware decide (they still refuse the training crawlers).
 * With apply=false it only reads the current settings.
 */
export async function openZoneToAnswerBots(zoneId: string, apply: boolean) {
  type Bm = { ai_bots_protection?: string; is_robots_txt_managed?: boolean; fight_mode?: boolean };
  const before = await cf<Bm>(`/zones/${zoneId}/bot_management`);
  if (!before.ok || !apply) return { before };
  const after = await cf<Bm>(`/zones/${zoneId}/bot_management`, {
    method: "PUT",
    body: JSON.stringify({ ai_bots_protection: "disabled", is_robots_txt_managed: false }),
  });
  return { before, after };
}

/**
 * Forward contact@{domain} to the newsroom inbox with Cloudflare Email Routing.
 * Turns routing on for the zone (Cloudflare adds its MX records), registers the
 * destination once per account (Cloudflare emails a verification link to it),
 * then adds the forwarding rule. Each step reports its own result.
 */
export async function forwardContactAddress(zoneId: string, domain: string, to: string) {
  const zone = await cf<{ account: { id: string } }>(`/zones/${zoneId}`);
  if (!zone.ok) return { zone };
  const account = zone.result.account.id;
  const dest = await cf<unknown>(`/accounts/${account}/email/routing/addresses`, {
    method: "POST",
    body: JSON.stringify({ email: to }),
  });
  const enable = await cf<unknown>(`/zones/${zoneId}/email/routing/dns`, { method: "POST", body: "{}" });
  const from = `contact@${domain}`;
  const existing = await cf<{ matchers: { value?: string }[] }[]>(`/zones/${zoneId}/email/routing/rules`);
  const has = existing.ok && existing.result.some((r) => r.matchers?.some((m) => m.value === from));
  const rule = has
    ? "exists"
    : await cf<unknown>(`/zones/${zoneId}/email/routing/rules`, {
        method: "POST",
        body: JSON.stringify({
          name: `${from} to newsroom`,
          enabled: true,
          matchers: [{ type: "literal", field: "to", value: from }],
          actions: [{ type: "forward", value: [to] }],
        }),
      });
  return { dest, enable, rule };
}

/** The Email Worker: hands every message it receives to the server, untouched. */
const INBOUND_WORKER = `export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const res = await fetch(env.ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + env.KEY, "X-Envelope-To": message.to, "User-Agent": "Mozilla/5.0 (compatible; ExpressInbound/1.0)" },
      body: raw,
    });
    if (!res.ok) console.log("inbound failed", res.status, message.to);
  },
};`;

/**
 * Deploy the inbound Email Worker once per account, then on each zone turn
 * Email Routing on and send releases@{domain} to it. Each step reports its result.
 */
export async function setupReleaseInbox(zoneId: string, domain: string, endpoint: string, key: string, deployed: Set<string>) {
  const zone = await cf<{ account: { id: string } }>(`/zones/${zoneId}`);
  if (!zone.ok) return { zone };
  const account = zone.result.account.id;
  const script = "express-release-inbox";
  let worker: unknown = "already";
  if (!deployed.has(account)) {
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify({
        main_module: "worker.js",
        compatibility_date: "2024-09-01",
        bindings: [
          { type: "plain_text", name: "ENDPOINT", text: endpoint },
          { type: "secret_text", name: "KEY", text: key },
        ],
      })], { type: "application/json" })
    );
    form.append("worker.js", new Blob([INBOUND_WORKER], { type: "application/javascript+module" }), "worker.js");
    const headers = authHeaders();
    if (!headers) return { error: "No Cloudflare credentials configured" };
    const res = await fetch(`${API}/accounts/${account}/workers/scripts/${script}`, { method: "PUT", headers, body: form, signal: AbortSignal.timeout(30000) });
    const body = (await res.json()) as { success: boolean; errors?: { code: number; message: string }[] };
    worker = body.success ? "deployed" : body.errors?.map((e) => `${e.code}: ${e.message}`).join("; ");
    if (body.success) deployed.add(account);
  }
  const enable = await enableEmailRouting(zoneId, domain);
  const address = `releases@${domain}`;
  const existing = await cf<{ matchers: { value?: string }[] }[]>(`/zones/${zoneId}/email/routing/rules`);
  const has = existing.ok && existing.result.some((r) => r.matchers?.some((m) => m.value === address));
  const rule = has
    ? "exists"
    : await cf<unknown>(`/zones/${zoneId}/email/routing/rules`, {
        method: "POST",
        body: JSON.stringify({
          name: `${address} to release inbox`,
          enabled: true,
          matchers: [{ type: "literal", field: "to", value: address }],
          actions: [{ type: "worker", value: [script] }],
        }),
      });
  return { worker, enable, rule };
}

/**
 * Turn Email Routing on for a zone. The API switch first; if the token may not
 * use it, the DNS it would write: Cloudflare's three MX records and its SPF,
 * replacing the old mail host's MX (the domains' old Hostinger mail is unused).
 */
export async function enableEmailRouting(zoneId: string, domain: string) {
  const api = await cf<unknown>(`/zones/${zoneId}/email/routing/enable`, { method: "POST", body: "{}" });
  if (api.ok) return { via: "api" };
  type Rec = { id: string; type: string; name: string; content: string; priority?: number };
  const mx = await cf<Rec[]>(`/zones/${zoneId}/dns_records?type=MX&per_page=50`);
  if (!mx.ok) return { via: "dns", error: mx.error, apiError: api.error };
  const removed: string[] = [];
  for (const r of mx.result) {
    if (r.name === domain && !/mx\.cloudflare\.net$/i.test(r.content)) {
      const d = await cf<unknown>(`/zones/${zoneId}/dns_records/${r.id}`, { method: "DELETE" });
      if (d.ok) removed.push(r.content);
    }
  }
  const have = new Set(mx.result.filter((r) => r.name === domain).map((r) => r.content.toLowerCase()));
  const added: string[] = [];
  for (const [host, prio] of [["route1.mx.cloudflare.net", 13], ["route2.mx.cloudflare.net", 86], ["route3.mx.cloudflare.net", 24]] as const) {
    if (have.has(host)) continue;
    const c = await cf<unknown>(`/zones/${zoneId}/dns_records`, { method: "POST", body: JSON.stringify({ type: "MX", name: domain, content: host, priority: prio, ttl: 1 }) });
    if (c.ok) added.push(host);
  }
  const txt = await cf<Rec[]>(`/zones/${zoneId}/dns_records?type=TXT&name=${domain}&per_page=50`);
  const spf = txt.ok ? txt.result.find((r) => r.content.replace(/"/g, "").startsWith("v=spf1")) : undefined;
  const want = "v=spf1 include:_spf.mx.cloudflare.net ~all";
  let spfDone = "kept";
  if (!spf) {
    const c = await cf<unknown>(`/zones/${zoneId}/dns_records`, { method: "POST", body: JSON.stringify({ type: "TXT", name: domain, content: want, ttl: 1 }) });
    spfDone = c.ok ? "added" : "failed";
  } else if (!spf.content.includes("_spf.mx.cloudflare.net")) {
    const merged = spf.content.replace(/"/g, "").replace(/\s*[~-]all\s*$/, "").replace(/include:[^\s]*hostinger[^\s]*/gi, "").trim() + " include:_spf.mx.cloudflare.net ~all";
    const u = await cf<unknown>(`/zones/${zoneId}/dns_records/${spf.id}`, { method: "PATCH", body: JSON.stringify({ content: merged.replace(/\s+/g, " ") }) });
    spfDone = u.ok ? "updated" : "failed";
  }
  const status = await cf<{ enabled?: boolean; status?: string }>(`/zones/${zoneId}/email/routing`);
  return { via: "dns", apiError: api.error, removed, added, spf: spfDone, routing: status.ok ? status.result : status.error };
}
