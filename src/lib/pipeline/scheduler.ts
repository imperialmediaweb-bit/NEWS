import pool from "@/lib/db";
import { feeds } from "@/config/feeds";

/**
 * Get categories that are due for fetching based on their interval.
 * Checks the last successful pipeline_run for each category's fetch stage.
 */
export async function getCategoriesDue(): Promise<string[]> {
  const categories = Array.from(new Set(feeds.map((f) => f.category)));
  const due: string[] = [];

  for (const category of categories) {
    const feedsForCategory = feeds.filter((f) => f.category === category);
    const minInterval = Math.min(...feedsForCategory.map((f) => f.intervalHours));

    const { rows } = await pool.query(
      `SELECT completed_at FROM pipeline_runs
       WHERE stage = 'fetch' AND category = $1
       AND error_message IS NULL
       ORDER BY completed_at DESC LIMIT 1`,
      [category]
    );

    if (rows.length === 0) {
      // Never fetched before
      due.push(category);
      continue;
    }

    const lastRun = new Date(rows[0].completed_at);
    const hoursAgo = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

    if (hoursAgo >= minInterval) {
      due.push(category);
    }
  }

  return due;
}

/**
 * Log the start of a pipeline run. Returns the run ID.
 */
export async function logRunStart(
  stage: string,
  category?: string
): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO pipeline_runs (stage, category) VALUES ($1, $2) RETURNING id`,
    [stage, category || null]
  );
  return rows[0].id;
}

/**
 * Log the completion of a pipeline run.
 */
export async function logRunEnd(
  runId: number,
  itemsProcessed: number,
  itemsFailed: number,
  durationMs: number,
  errorMessage?: string
): Promise<void> {
  await pool.query(
    `UPDATE pipeline_runs
     SET items_processed = $2, items_failed = $3, duration_ms = $4,
         error_message = $5, completed_at = NOW()
     WHERE id = $1`,
    [runId, itemsProcessed, itemsFailed, durationMs, errorMessage || null]
  );
}

/**
 * Check if the pipeline is enabled.
 */
export async function isPipelineEnabled(): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM pipeline_config WHERE key = 'enabled'"
    );
    return rows[0]?.value === "true";
  } catch {
    return false;
  }
}
