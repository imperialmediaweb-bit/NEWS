import crypto from "crypto";

/**
 * Who is allowed to drive the paid-order endpoints.
 *
 * CRON_SECRET is the network's own key. The scheduled jobs and the admin UI
 * authenticate with it, so it has to keep working exactly as it does — the day
 * it changes, publishing stops across every site.
 *
 * SHOP_KEY is a second credential, issued to the Media Chief shop so it can
 * create a campaign and publish it without being handed the key that runs
 * everything else. Two consequences worth the extra variable: revoking the
 * shop's access later is one deletion and the cron keeps running, and a key
 * that leaks from the shop does not hand over the whole network.
 *
 * Either key is accepted here and nowhere else.
 */
export function orderKeyAccepted(candidate: string | null | undefined): boolean {
  const key = (candidate || "").trim();
  if (!key) return false;

  const accepted = [process.env.CRON_SECRET, process.env.SHOP_KEY].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );

  // Compared byte by byte in constant time: a plain === leaks, through how
  // long it takes to fail, how much of a guess was right.
  return accepted.some((valid) => {
    const a = Buffer.from(key);
    const b = Buffer.from(valid);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });
}

/** The key presented on a request: body, query string or bearer header. */
export function keyFromRequest(
  req: { nextUrl: URL; headers: Headers },
  bodyKey?: unknown
): string | null {
  if (typeof bodyKey === "string" && bodyKey) return bodyKey;
  return (
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null
  );
}
