import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Direct indexing submissions to search engines, for use right after an
 * article is published.
 *
 * Every provider is optional — if its credentials are absent, that provider
 * is skipped rather than failing the batch.
 *
 * Env vars:
 *   GOOGLE_INDEXING_SA_KEY                                     (full service-account JSON)
 *   — or —
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY  (Google Indexing API)
 *   BING_WEBMASTER_API_KEY        (Bing Webmaster → Settings → API Access)
 *   YANDEX_WEBMASTER_TOKEN        (OAuth token from oauth.yandex.com)
 *   YANDEX_WEBMASTER_HOST_ID      (host id from Yandex Webmaster)
 *   FACEBOOK_APP_ACCESS_TOKEN     (refreshes the Open Graph cache for a URL)
 *
 * Note on Google: the Indexing API is documented for JobPosting and
 * BroadcastEvent. Submitting news URLs often works but is not guaranteed —
 * treat it as a bonus on top of sitemaps and IndexNow, not a replacement.
 */

const TIMEOUT = 8000;

/** Cached Google token — valid an hour, so don't re-sign a JWT per URL. */
let googleToken: { value: string; expiresAt: number } | null = null;

/**
 * Credentials arrive in one of two layouts: a full service-account JSON blob
 * (GOOGLE_INDEXING_SA_KEY) or the separate email + private key pair used
 * elsewhere in the app. Accept both.
 */
function readCredentials(): { email: string; key: string } | null {
  const full = process.env.GOOGLE_INDEXING_SA_KEY;
  if (full) {
    try {
      const parsed = JSON.parse(full);
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, key: parsed.private_key };
      }
    } catch {
      // Fall through to the split env vars.
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) return null;
  return { email, key };
}

async function getIndexingToken(): Promise<string | null> {
  const creds = readCredentials();
  if (!creds) return null;

  if (googleToken && Date.now() < googleToken.expiresAt) return googleToken.value;

  try {
    const token = await getGoogleAccessToken(
      creds.email,
      creds.key,
      "https://www.googleapis.com/auth/indexing"
    );
    // Google tokens last an hour; refresh a few minutes early.
    googleToken = { value: token, expiresAt: Date.now() + 55 * 60 * 1000 };
    return token;
  } catch (e) {
    console.error("[indexing] Google token failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** True when Google Indexing credentials are configured at all. */
export function hasGoogleIndexingCredentials(): boolean {
  return readCredentials() !== null;
}

export async function submitGoogleIndexing(
  url: string,
  action: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
): Promise<boolean> {
  const token = await getIndexingToken();
  if (!token) return false;

  try {
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type: action }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return res.ok;
  } catch (e) {
    console.error("[indexing] Google submit failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** Bing accepts up to 500 URLs per call for one site. */
export async function submitBingUrls(siteUrl: string, urls: string[]): Promise<boolean> {
  const apiKey = process.env.BING_WEBMASTER_API_KEY;
  if (!apiKey || urls.length === 0) return false;

  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ siteUrl, urlList: urls.slice(0, 500) }),
        signal: AbortSignal.timeout(TIMEOUT),
      }
    );
    return res.ok;
  } catch (e) {
    console.error("[indexing] Bing submit failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function submitYandexRecrawl(url: string): Promise<boolean> {
  const token = process.env.YANDEX_WEBMASTER_TOKEN;
  const hostId = process.env.YANDEX_WEBMASTER_HOST_ID;
  if (!token || !hostId) return false;

  try {
    const res = await fetch(
      `https://api.webmaster.yandex.net/v4/user/hosts/${hostId}/recrawl/queue/`,
      {
        method: "POST",
        headers: { Authorization: `OAuth ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(TIMEOUT),
      }
    );
    return res.ok;
  } catch (e) {
    console.error("[indexing] Yandex recrawl failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * Force Facebook to re-scrape a URL's Open Graph tags, so shared links show
 * the right title and image instead of a stale cached version.
 */
export async function refreshFacebookCache(url: string): Promise<boolean> {
  const accessToken = process.env.FACEBOOK_APP_ACCESS_TOKEN;
  if (!accessToken) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true&access_token=${accessToken}`,
      { method: "POST", signal: AbortSignal.timeout(TIMEOUT) }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export interface EngineResult {
  google: boolean;
  bing: boolean;
  yandex: boolean;
  facebook: boolean;
}

/** Submit one URL to every configured service, in parallel. */
export async function submitToAllEngines(
  siteUrl: string,
  articleUrl: string
): Promise<EngineResult> {
  const [google, bing, yandex, facebook] = await Promise.all([
    submitGoogleIndexing(articleUrl),
    submitBingUrls(siteUrl, [articleUrl]),
    submitYandexRecrawl(articleUrl),
    refreshFacebookCache(articleUrl),
  ]);
  return { google, bing, yandex, facebook };
}
