import pool from "@/lib/db";

/**
 * Reader submissions (news tips, photos/videos, community events, local
 * achievements), as on the Romanian Expres network: nothing is published
 * directly. Each one waits in the newsroom's review queue; an approved one goes
 * to the same rewrite queue and rules as every other source.
 */
export const SUBMISSION_TYPES = {
  tip: "News tip",
  photo: "Photo or video",
  event: "Community event",
  achievement: "Local achievement",
  closing: "Closing or delay",
} as const;
export type SubmissionType = keyof typeof SUBMISSION_TYPES;

let ready: Promise<unknown> | null = null;
export function ensureSubmissionsTable() {
  ready ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS submissions (
         id SERIAL PRIMARY KEY,
         site_slug VARCHAR(100) NOT NULL,
         state VARCHAR(50) NOT NULL,
         type VARCHAR(20) NOT NULL,
         title TEXT NOT NULL,
         body TEXT NOT NULL,
         city TEXT,
         event_date TEXT,
         name TEXT NOT NULL,
         email TEXT NOT NULL,
         phone TEXT,
         photo_url TEXT,
         video_url TEXT,
         consent BOOLEAN NOT NULL DEFAULT FALSE,
         ip_hash TEXT,
         status VARCHAR(20) NOT NULL DEFAULT 'pending',
         note TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         reviewed_at TIMESTAMPTZ
       );
       CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at DESC);`
    )
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}
