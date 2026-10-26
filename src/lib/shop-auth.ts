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

  // Read through the object rather than as `process.env.SHOP_KEY`, which a
  // bundler is free to replace with whatever the value was at build time —
  // and this one is set after the build as often as before it.
  const env = process.env as Record<string, string | undefined>;
  const accepted = [env["CRON_SECRET"], env["SHOP_KEY"]].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );

  if (accepted.length === 0) {
    console.error("[shop-auth] neither CRON_SECRET nor SHOP_KEY is set");
    return false;
  }

  // Compared byte by byte in constant time: a plain === leaks, through how
  // long it takes to fail, how much of a guess was right.
  const ok = accepted.some((valid) => {
    const a = Buffer.from(key);
    const b = Buffer.from(valid);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });

  if (!ok) {
    // Lengths only — enough to tell "the wrong key" from "the key is not
    // loaded here", without putting either secret in a log.
    console.error(
      "[shop-auth] rejected a key of length",
      key.length,
      "| cron set:",
      Boolean(env["CRON_SECRET"]),
      "| shop set:",
      Boolean(env["SHOP_KEY"])
    );
  }
  return ok;
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
