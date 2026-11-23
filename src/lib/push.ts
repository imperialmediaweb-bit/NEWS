import webpush from "web-push";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { TZ } from "@/config/timezones";

/**
 * Browser push notifications, our own (same system as the Expres network):
 * the Web Push standard is free at any volume through Google, Apple and
 * Mozilla; we only keep the subscriber list, per paper.
 *  - VAPID keys are generated once on the server and kept in `push_keys`
 *    (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in Railway override them).
 *  - subscribe: POST /api/push/subscribe (the "Turn on alerts" bar)
 *  - automatic: autoPush() from the cron, at most PUSH_PER_DAY (2) local or
 *    politics stories per paper per day, 4+ hours apart, 8 am to 9 pm local.
 *  - manual: POST /api/push/send (admin)
 * Kill switch without a deploy: PUSH_NOTIFICATIONS=0.
 */

export type PushPayload = { title: string; body?: string; url: string; icon?: string; image?: string; tag?: string };
type Keys = { publicKey: string; privateKey: string; subject: string };

const PUSH_PER_DAY = Number(process.env.PUSH_PER_DAY || 2);
const HOURS_BETWEEN = 4;

export const pushEnabled = () => process.env.PUSH_NOTIFICATIONS !== "0";

let schemaReady = false;
export async function pushSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS push_keys (
    id INT PRIMARY KEY, public_key TEXT NOT NULL, private_key TEXT NOT NULL, subject TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS push_subscribers (
    id SERIAL PRIMARY KEY, site_slug VARCHAR(100) NOT NULL, endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL, auth TEXT NOT NULL, ua TEXT, failures INT NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_subscribers_site ON push_subscribers(site_slug)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS push_sends (
    id SERIAL PRIMARY KEY, site_slug VARCHAR(100) NOT NULL, article_id INTEGER, title TEXT,
    subscribers INT NOT NULL DEFAULT 0, sent INT NOT NULL DEFAULT 0, failed INT NOT NULL DEFAULT 0,
    manual BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_sends_site ON push_sends(site_slug, created_at DESC)`);
  // a story goes out automatically only once per paper
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_push_sends_auto ON push_sends(site_slug, article_id)
    WHERE article_id IS NOT NULL AND manual = FALSE`);
  schemaReady = true;
}

let keysCache: Keys | null = null;
/** VAPID keys: from Railway if set, otherwise generated once and kept in the database. */
export async function vapidKeys(): Promise<Keys> {
  if (keysCache) return keysCache;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@alabama-express.com";
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    keysCache = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY, subject };
    return keysCache;
  }
  await pushSchema();
  const read = async () => {
    const r = await pool.query(`SELECT public_key, private_key, subject FROM push_keys WHERE id = 1`);
    const x = r.rows[0] as { public_key: string; private_key: string; subject: string } | undefined;
    return x ? { publicKey: x.public_key, privateKey: x.private_key, subject: x.subject } : null;
  };
  let k = await read();
  if (!k) {
    const g = webpush.generateVAPIDKeys();
    await pool.query(`INSERT INTO push_keys (id, public_key, private_key, subject) VALUES (1, $1, $2, $3) ON CONFLICT (id) DO NOTHING`, [g.publicKey, g.privateKey, subject]);
    k = await read();
  }
  if (!k) throw new Error("VAPID keys could not be read");
  keysCache = k;
  return k;
}

export async function saveSubscriber(site: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, ua?: string | null): Promise<void> {
  await pushSchema();
  await pool.query(
    `INSERT INTO push_subscribers (site_slug, endpoint, p256dh, auth, ua) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET site_slug = EXCLUDED.site_slug, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, ua = EXCLUDED.ua, failures = 0`,
    [site, sub.endpoint, sub.keys.p256dh, sub.keys.auth, (ua || "").slice(0, 300) || null]
  );
}

export type SendResult = { id: number; subscribers: number; sent: number; failed: number; duplicate?: boolean };

/** Send one notification to every subscriber of a paper. With an article id and not manual: once only. */
export async function sendToAll(site: string, payload: PushPayload, opts?: { articleId?: number | null; manual?: boolean }): Promise<SendResult> {
  await pushSchema();
  const keys = await vapidKeys();
  let id = 0;
  try {
    const ins = await pool.query(`INSERT INTO push_sends (site_slug, article_id, title, manual) VALUES ($1, $2, $3, $4) RETURNING id`, [site, opts?.articleId ?? null, payload.title.slice(0, 300), !!opts?.manual]);
    id = Number(ins.rows[0].id);
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { id: 0, subscribers: 0, sent: 0, failed: 0, duplicate: true };
    throw e;
  }
  const url = `${payload.url}${payload.url.includes("?") ? "&" : "?"}utm_source=push&utm_medium=notification`;
  const body = JSON.stringify({ ...payload, url });
  const { rows } = await pool.query(`SELECT id, endpoint, p256dh, auth FROM push_subscribers WHERE site_slug = $1`, [site]);
  let sent = 0, failed = 0;
  const gone: number[] = [], bad: number[] = [];
  for (let i = 0; i < rows.length; i += 50) {
    await Promise.all(rows.slice(i, i + 50).map(async (a: { id: number; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, body, { vapidDetails: keys, TTL: 3600, urgency: "normal", timeout: 10000 });
        sent++;
      } catch (e) {
        failed++;
        const sc = (e as { statusCode?: number }).statusCode;
        (sc === 404 || sc === 410 ? gone : bad).push(a.id);
      }
    }));
  }
  if (gone.length) await pool.query(`DELETE FROM push_subscribers WHERE id = ANY($1::int[])`, [gone]).catch(() => {});
  if (bad.length) await pool.query(`UPDATE push_subscribers SET failures = failures + 1 WHERE id = ANY($1::int[])`, [bad]).catch(() => {});
  await pool.query(`DELETE FROM push_subscribers WHERE failures >= 5`).catch(() => {});
  await pool.query(`UPDATE push_sends SET subscribers = $2, sent = $3, failed = $4 WHERE id = $1`, [id, rows.length, sent, failed]);
  return { id, subscribers: rows.length, sent, failed };
}

/** Send one story as a notification: headline, short summary, the paper's icon, the photo. */
export async function pushArticle(a: { id: number; site_slug: string; title: string; summary?: string | null; slug: string; category: string; featured_image?: string | null }, opts?: { manual?: boolean }) {
  const cfg = sites[a.site_slug];
  if (!cfg?.domain) throw new Error(`unknown site ${a.site_slug}`);
  const url = `https://${cfg.domain}/${a.category}/${a.slug}`;
  return sendToAll(a.site_slug, {
    title: a.title.slice(0, 90),
    body: String(a.summary || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140),
    url,
    icon: `https://${cfg.domain}/api/favicon?site=${a.site_slug}`,
    image: a.featured_image || undefined,
    tag: `story-${a.id}`,
  }, { articleId: a.id, manual: !!opts?.manual });
}

/**
 * Automatic sends: for each paper that has subscribers, between 8 am and
 * 9 pm local time, at most PUSH_PER_DAY a day and HOURS_BETWEEN apart, the
 * newest local or politics story with a photo from the last 3 hours.
 */
export async function autoPush(): Promise<Array<{ site: string; title: string; sent: number }>> {
  if (!pushEnabled()) return [];
  await pushSchema();
  const { rows: withSubs } = await pool.query(`SELECT site_slug, COUNT(*)::int n FROM push_subscribers GROUP BY site_slug`);
  const out: Array<{ site: string; title: string; sent: number }> = [];
  for (const { site_slug } of withSubs as Array<{ site_slug: string }>) {
    const cfg = sites[site_slug];
    if (!cfg) continue;
    const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: TZ[cfg.state] || "America/New_York" }));
    if (hour < 8 || hour >= 21) continue;
    const { rows: recent } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')::int day,
              COUNT(*) FILTER (WHERE created_at > now() - make_interval(hours => $2))::int near
         FROM push_sends WHERE site_slug = $1 AND manual = FALSE`, [site_slug, HOURS_BETWEEN]);
    if (recent[0].day >= PUSH_PER_DAY || recent[0].near > 0) continue;
    const { rows: pick } = await pool.query(
      `SELECT a.id, a.title, a.summary, a.slug, a.category, a.featured_image FROM articles a JOIN sites s ON s.id = a.site_id
        WHERE s.slug = $1 AND a.published_at > now() - interval '3 hours' AND a.category IN ('local-news', 'politics')
          AND a.featured_image IS NOT NULL AND a.featured_image <> ''
          AND NOT EXISTS (SELECT 1 FROM push_sends p WHERE p.site_slug = $1 AND p.article_id = a.id)
        ORDER BY a.published_at DESC LIMIT 1`, [site_slug]);
    if (!pick[0]) continue;
    const r = await pushArticle({ ...pick[0], site_slug });
    if (!r.duplicate) out.push({ site: site_slug, title: pick[0].title, sent: r.sent });
  }
  return out;
}
