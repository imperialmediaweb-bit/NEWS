import crypto from "crypto";

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

  const key = generateIndexNowKey(domain);
  const host = domain;

  const payload = {
    host,
    key,
    keyLocation: `https://${domain}/indexnow.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    // IndexNow returns 200 or 202 on success
    return res.status === 200 || res.status === 202;
  } catch {
    console.error("[IndexNow] Failed to submit URLs to IndexNow");
    return false;
  }
}
