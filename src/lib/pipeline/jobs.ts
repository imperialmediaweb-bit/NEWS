import pool from "@/lib/db";

/**
 * Interval-based job claiming for the pipeline.
 *
 * The old scheduler derived what to run from the current wall-clock minute
 * (`Math.floor(utcMinute / 5) % 5` for the fetch batch, `utcMinute < 25` to
 * gate it). That only works if the trigger fires on the exact minutes the code
 * expects. A trigger a few minutes out of phase silently skipped whole batches
 * forever — which is how Alabama through Georgia stopped publishing while the
 * rest of the network kept going.
 *
 * Claiming is instead based on "how long since this job last ran", so any
 * trigger cadence works, and the claim is a single atomic statement so the
 * multiple app replicas can all tick without doing the work more than once.
 */

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS pipeline_jobs (
       job          TEXT PRIMARY KEY,
       last_run_at  TIMESTAMPTZ NOT NULL DEFAULT to_timestamp(0),
       run_count    INTEGER NOT NULL DEFAULT 0
     )`
  );
  schemaReady = true;
}

export interface Claim {
  claimed: boolean;
  /** How many times this job has run — used to rotate the fetch batch. */
  runCount: number;
}

/**
 * Try to claim a job. Returns claimed:true to exactly one caller once the
 * interval has elapsed; everyone else gets claimed:false.
 *
 * The UPDATE's WHERE clause is what makes this safe across replicas: Postgres
 * evaluates it while holding the row lock, so a second replica arriving in the
 * same instant sees the already-bumped timestamp and matches nothing.
 */
export async function claimJob(job: string, intervalSeconds: number): Promise<Claim> {
  try {
    await ensureSchema();
    const { rows } = await pool.query(
      `INSERT INTO pipeline_jobs (job, last_run_at, run_count)
            VALUES ($1, NOW(), 1)
       ON CONFLICT (job) DO UPDATE
              SET last_run_at = NOW(),
                  run_count   = pipeline_jobs.run_count + 1
            WHERE pipeline_jobs.last_run_at < NOW() - make_interval(secs => $2)
        RETURNING run_count`,
      [job, intervalSeconds]
    );

    if (rows.length === 0) return { claimed: false, runCount: 0 };
    return { claimed: true, runCount: Number(rows[0].run_count) };
  } catch (e) {
    console.error(`[jobs] claim failed for ${job}:`, e instanceof Error ? e.message : e);
    return { claimed: false, runCount: 0 };
  }
}

/** Current state of every job, for the status endpoint. */
export async function listJobs(): Promise<
  { job: string; lastRunAt: string | null; runCount: number; secondsAgo: number | null }[]
> {
  try {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT job, last_run_at, run_count,
              EXTRACT(EPOCH FROM (NOW() - last_run_at))::int AS seconds_ago
         FROM pipeline_jobs
        ORDER BY job`
    );
    return rows.map((r) => ({
      job: r.job as string,
      lastRunAt: r.last_run_at ? new Date(r.last_run_at).toISOString() : null,
      runCount: Number(r.run_count),
      secondsAgo: r.seconds_ago === null ? null : Number(r.seconds_ago),
    }));
  } catch {
    return [];
  }
}
