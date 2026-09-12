import { getGoogleAccessToken } from "@/lib/google-auth";
import { submitToIndexNow } from "@/lib/indexnow";

/**
 * Notify every search engine we can reach about freshly published URLs.
 *
 * 1. IndexNow  — Bing, Yandex, Seznam, Naver (instant, no setup: the key is
 *                served from /indexnow.txt on every domain).
 * 2. Google Indexing API — direct request, one call per URL. Needs a service
 *                account added as Owner on each Search Console property.
 *                Env: GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY
 *                (or the full JSON in GOOGLE_INDEXING_SA_KEY). Quota is 200
 *                URLs/day per Google Cloud project.
 * 3. WebSub (PubSubHubbub) — tells Google's hub the site feed changed, so the
 *                crawler comes back sooner. No setup.
 *
 * Google does not support IndexNow, which is why 2 and 3 exist.
 */

export interface EngineResult {
  indexNow: "ok" | "failed" | "skipped";
  google: { ok: number; failed: number } | "skipped";
  websub: "ok" | "failed";
}

const TIMEOUT_MS = 8000;

function googleCredentials(): { email: string; privateKey: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (email && key) return { email, privateKey: key };

  const json = process.env.GOOGLE_INDEXING_SA_KEY;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, privateKey: parsed.private_key };
      }
    } catch {
      console.error("[search-engines] GOOGLE_INDEXING_SA_KEY is not valid JSON");
    }
  }
  return null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function googleIndexingToken(): Promise<string | null> {
  const creds = googleCredentials();
  if (!creds) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  try {
    const token = await getGoogleAccessToken(
      creds.email,
      creds.privateKey,
      "https://www.googleapis.com/auth/indexing"
    );
    cachedToken = { token, expiresAt: Date.now() + 55 * 60_000 };
    return token;
  } catch (err) {
    console.error("[search-engines] Google auth failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Google Indexing API: one request per URL, sequential to respect the quota. */
export async function submitToGoogleIndexing(
  urls: string[]
): Promise<{ ok: number; failed: number } | "skipped"> {
  const token = await googleIndexingToken();
  if (!token) return "skipped";

  let ok = 0;
  let failed = 0;
  for (const url of urls) {
    try {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        ok++;
      } else {
        failed++;
        if (failed === 1) {
          console.error(`[search-engines] Google Indexing API ${res.status} for ${url}:`, (await res.text()).slice(0, 200));
        }
      }
    } catch {
      failed++;
    }
  }
  return { ok, failed };
}

/** WebSub: tell Google's hub that this domain's feed has new items. */
export async function publishWebSub(domain: string): Promise<boolean> {
  try {
    const res = await fetch("https://pubsubhubbub.appspot.com/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "hub.mode": "publish", "hub.url": `https://${domain}/feed` }).toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/** Push a domain's new URLs to every engine at once. Never throws. */
export async function notifySearchEngines(domain: string, urls: string[]): Promise<EngineResult> {
  if (urls.length === 0) {
    return { indexNow: "skipped", google: "skipped", websub: "failed" };
  }
  const [indexNow, google, websub] = await Promise.all([
    submitToIndexNow(domain, urls).then((ok): "ok" | "failed" => (ok ? "ok" : "failed")),
    submitToGoogleIndexing(urls),
    publishWebSub(domain),
  ]);
  return { indexNow, google, websub: websub ? "ok" : "failed" };
}

/**
 * Same, for URLs spread across many domains (one client article published on
 * the whole network). Domains run in parallel; Google stays sequential inside
 * each one because of its quota.
 */
export async function notifySearchEnginesForMany(
  urlsByDomain: Map<string, string[]>
): Promise<Record<string, EngineResult>> {
  const entries = Array.from(urlsByDomain.entries());
  const settled = await Promise.allSettled(entries.map(([domain, urls]) => notifySearchEngines(domain, urls)));
  const out: Record<string, EngineResult> = {};
  settled.forEach((r, i) => {
    out[entries[i][0]] =
      r.status === "fulfilled" ? r.value : { indexNow: "failed", google: "skipped", websub: "failed" };
  });
  return out;
}
