import crypto from "crypto";

/** The shared key the network used before per-domain keys; Bing still binds some hosts to it. */
export const LEGACY_INDEXNOW_KEY = "b7d8e9f2a1c4d6e8f0a2b4c6d8e0f2a4";

/**
 * Generate a deterministic IndexNow key from a domain name.
 * The key is a 32-character hex string derived from a SHA-256 hash.
 */
export function generateIndexNowKey(domain: string): string {
  return crypto
    .createHash("sha256")
    .update(`indexnow-key-${domain}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Submit a batch of URLs to the IndexNow API for instant indexing.
 */
export async function submitToIndexNow(
  domain: string,
  urls: string[]
): Promise<boolean> {
  if (urls.length === 0) return false;

  // Bing remembers the first key a host used: some sites are bound to the
  // per-domain key, others to the legacy shared one. Try the first, then the other.
  try {
    for (const [key, keyLocation] of [
      [generateIndexNowKey(domain), `https://${domain}/indexnow.txt`],
      [LEGACY_INDEXNOW_KEY, `https://${domain}/${LEGACY_INDEXNOW_KEY}.txt`],
    ]) {
      const res = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: domain, key, keyLocation, urlList: urls }),
      });
      // IndexNow returns 200 or 202 on success
      if (res.status === 200 || res.status === 202) return true;
      if (res.status !== 403) return false;
    }
    return false;
  } catch {
    console.error("[IndexNow] Failed to submit URLs to IndexNow");
    return false;
  }
}
