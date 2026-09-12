/**
 * In-process pipeline trigger.
 *
 * The pipeline used to depend on an external cron service calling
 * /api/pipeline/cron. That is one more thing to own, one more thing to
 * silently stop, and it was impossible to tell from inside the app whether it
 * was still alive. This ticks from inside the server process instead, so the
 * pipeline runs for as long as the app is up and nothing else has to be
 * configured.
 *
 * Running several app replicas is fine: every tick only *claims* work through
 * an atomic statement in pipeline_jobs, so one replica wins and the others do
 * nothing. An external trigger can still call the same endpoint alongside this
 * one — it will simply find nothing due.
 *
 * Set PIPELINE_INTERNAL_CRON=off to disable.
 */

const TICK_MS = 120_000;

export async function register() {
  // Edge runtime has no timers we want here, and the build-time import of this
  // file must not start a ticker.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.PIPELINE_INTERNAL_CRON === "off") return;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET is not set — internal pipeline trigger disabled");
    return;
  }

  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/api/pipeline/cron?key=${encodeURIComponent(secret)}`;

  const tick = async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        // Identifiable in access logs, and safely past the bot-blocking
        // patterns in middleware.ts.
        headers: { "User-Agent": "ExpressNetwork-InternalCron/1.0" },
        // The cron endpoint dispatches its stages fire-and-forget, so it
        // answers quickly; anything slower than this means trouble upstream.
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        console.error(`[cron] tick returned ${res.status}`);
        return;
      }
      const body = (await res.json()) as { triggered?: string[] };
      const triggered = body.triggered ?? [];
      // Only log when something actually happened — a line every two minutes
      // saying "nothing_due" is just noise in the Railway logs.
      const idle =
        triggered.length === 0 ||
        triggered.every((a) => a === "nothing_due" || a === "outside_publishing_hours");
      if (!idle) console.log(`[cron] ${triggered.join(", ")}`);
    } catch (e) {
      console.error("[cron] tick failed:", e instanceof Error ? e.message : e);
    }
  };

  // Give the server a moment to start accepting connections before the first
  // loopback request.
  setTimeout(tick, 20_000);
  const timer = setInterval(tick, TICK_MS);
  // Don't hold the process open on shutdown.
  timer.unref?.();

  console.log(`[cron] internal pipeline trigger started (every ${TICK_MS / 1000}s)`);
}
