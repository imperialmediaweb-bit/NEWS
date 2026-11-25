import pool from "@/lib/db";
import { parseHours as _parseHours } from "@/lib/opening-hours";
import { sites } from "@/config/sites";
import { citiesOf } from "@/lib/local-data";
import { slugOf } from "@/lib/topic-page";
import { DIR_CATEGORIES, categorize, catBySlug } from "@/lib/directory-categories";

/**
 * Local business directory (per paper, per city, per category).
 *  - Starts filled from OpenStreetMap (ODbL, credited on every page): only
 *    named businesses with a phone or a website, in the categories of
 *    directory-categories.ts, never adult / cannabis / vape / weapons / gambling.
 *  - Owners claim their page or add their business (free), or buy Business
 *    Spotlight ($49, 12 months: sponsored article, photo, website, top spot)
 *    or Spotlight + Homepage ($149).
 *  - Reviews only from readers with a confirmed email, one per email per
 *    business; owners cannot delete them.
 */

export type Business = {
  id: number; site_slug: string; slug: string; name: string; category: string; city: string; city_slug: string;
  address: string | null; zip: string | null; lat: number | null; lon: number | null; phone: string | null; website: string | null;
  hours: string | null; description: string | null; facebook: string | null; instagram: string | null; photo_url: string | null;
  source: string; tier: string; tier_until: string | null; claimed: boolean; status: string; article_slug: string | null;
  rating_sum: number; rating_count: number; osm_id: string | null; updated_at: string;
};

let ready: Promise<unknown> | null = null;
export function dirSchema() {
  ready ??= pool.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY, site_slug VARCHAR(100) NOT NULL, slug TEXT NOT NULL, osm_id TEXT UNIQUE,
      name TEXT NOT NULL, category VARCHAR(60) NOT NULL, city TEXT NOT NULL, city_slug TEXT NOT NULL,
      address TEXT, zip TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION, phone TEXT, website TEXT, hours TEXT,
      description TEXT, facebook TEXT, instagram TEXT, photo_url TEXT, owner_email TEXT,
      source VARCHAR(20) NOT NULL DEFAULT 'osm', tier VARCHAR(20) NOT NULL DEFAULT 'free', tier_until TIMESTAMPTZ,
      claimed BOOLEAN NOT NULL DEFAULT FALSE, status VARCHAR(20) NOT NULL DEFAULT 'active', article_slug TEXT,
      rating_sum INT NOT NULL DEFAULT 0, rating_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (site_slug, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_biz_city_cat ON businesses(site_slug, city_slug, category) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS idx_biz_cat ON businesses(site_slug, category) WHERE status = 'active';
    CREATE INDEX IF NOT EXISTS idx_biz_name ON businesses(site_slug, lower(name));
    CREATE TABLE IF NOT EXISTS business_reviews (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), body TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT FALSE, token TEXT NOT NULL, owner_reply TEXT, hidden BOOLEAN NOT NULL DEFAULT FALSE,
      ip_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (business_id, email)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_biz ON business_reviews(business_id) WHERE verified AND NOT hidden;
    CREATE TABLE IF NOT EXISTS business_claims (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, site_slug VARCHAR(100) NOT NULL,
      data JSONB NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', order_id INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS business_removals (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL,
      reason TEXT, status VARCHAR(20) NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS business_deals (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, site_slug VARCHAR(100) NOT NULL,
      title TEXT NOT NULL, details TEXT, code TEXT, expires_at DATE NOT NULL, order_id INT, status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_deals_live ON business_deals(site_slug, status, expires_at);
    CREATE TABLE IF NOT EXISTS directory_imports (
      state VARCHAR(4) PRIMARY KEY, status TEXT, found INT, saved INT, started_at TIMESTAMPTZ, finished_at TIMESTAMPTZ, error TEXT
    );
    ALTER TABLE directory_imports ADD COLUMN IF NOT EXISTS groups_done TEXT[] NOT NULL DEFAULT '{}';
    ALTER TABLE directory_imports ADD COLUMN IF NOT EXISTS heartbeat TIMESTAMPTZ;
    ALTER TABLE business_claims ADD COLUMN IF NOT EXISTS source_info TEXT;
  `).catch((e) => { ready = null; throw e; });
  return ready;
}

/** One card per business name: chains with several branches show once, with how many locations. */
export function collapseChains<T extends { name: string; slug: string; address: string | null; phone: string | null }>(list: T[]): Array<T & { locations: number; branches: Array<{ slug: string; address: string | null; phone: string | null }> }> {
  const seen = new Map<string, T & { locations: number; branches: Array<{ slug: string; address: string | null; phone: string | null }> }>();
  for (const b of list) {
    const k = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const hit = seen.get(k);
    const br = { slug: b.slug, address: b.address, phone: b.phone };
    if (hit) { hit.locations++; hit.branches.push(br); } else seen.set(k, { ...b, locations: 1, branches: [br] });
  }
  return Array.from(seen.values());
}

export const isSpotlight = (b: Pick<Business, "tier" | "tier_until">) => b.tier !== "free" && (!b.tier_until || new Date(b.tier_until) > new Date());
export const ratingOf = (b: Pick<Business, "rating_sum" | "rating_count">) => (b.rating_count ? Math.round((b.rating_sum / b.rating_count) * 10) / 10 : null);
export const bizHref = (b: Pick<Business, "slug">) => `/directory/listing/${b.slug}`;
const ORDER = `(tier <> 'free' AND (tier_until IS NULL OR tier_until > now())) DESC, rating_count > 0 DESC, (rating_sum::float / NULLIF(rating_count, 0)) DESC NULLS LAST, claimed DESC, (website IS NOT NULL) DESC, name`;

export async function listBusinesses(site: string, opts: { city?: string; category?: string; limit?: number; offset?: number }) {
  await dirSchema();
  const where = ["site_slug = $1", "status = 'active'"];
  const args: unknown[] = [site];
  if (opts.city) { args.push(opts.city); where.push(`city_slug = $${args.length}`); }
  if (opts.category) { args.push(opts.category); where.push(`category = $${args.length}`); }
  args.push(opts.limit ?? 30, opts.offset ?? 0);
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE ${where.join(" AND ")} ORDER BY ${ORDER} LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
  return rows as Business[];
}

/** Count per category for a city (or the whole state). */
export async function categoryCounts(site: string, city?: string) {
  await dirSchema();
  const { rows } = await pool.query(
    `SELECT category, COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND status = 'active' ${city ? "AND city_slug = $2" : ""} GROUP BY category`,
    city ? [site, city] : [site]
  );
  return Object.fromEntries(rows.map((r: { category: string; n: number }) => [r.category, r.n])) as Record<string, number>;
}

/** Cities with the most businesses (city slug, name, count). */
export async function topCities(site: string, limit = 40, category?: string) {
  await dirSchema();
  const { rows } = await pool.query(
    `SELECT city_slug, MIN(city) city, COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND status = 'active' ${category ? "AND category = $3" : ""}
      GROUP BY city_slug ORDER BY n DESC LIMIT $2`,
    category ? [site, limit, category] : [site, limit]
  );
  return rows as Array<{ city_slug: string; city: string; n: number }>;
}

export async function getBusiness(site: string, slug: string) {
  await dirSchema();
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE site_slug = $1 AND slug = $2 AND status <> 'hidden' LIMIT 1`, [site, slug]);
  return (rows[0] as Business) || null;
}

export async function reviewsOf(id: number) {
  await dirSchema();
  const { rows } = await pool.query(`SELECT id, rating, body, name, owner_reply, created_at FROM business_reviews WHERE business_id = $1 AND verified AND NOT hidden ORDER BY created_at DESC LIMIT 50`, [id]);
  return rows as Array<{ id: number; rating: number; body: string; name: string; owner_reply: string | null; created_at: string }>;
}

export async function searchBusinesses(site: string, q: string, city?: string, limit = 12) {
  await dirSchema();
  const args: unknown[] = [site, `%${q.toLowerCase().replace(/[%_]/g, "")}%`, limit];
  let extra = "";
  if (city) { args.push(slugOf(city)); extra = ` AND city_slug = $${args.length}`; }
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE site_slug = $1 AND status <> 'hidden' AND lower(name) LIKE $2${extra} ORDER BY ${ORDER} LIMIT $3`, args);
  return rows as Business[];
}

export async function uniqueSlug(site: string, name: string, citySlug: string) {
  const base = `${slugOf(name).slice(0, 60)}-${citySlug}`.replace(/-+/g, "-");
  const { rows } = await pool.query(`SELECT slug FROM businesses WHERE site_slug = $1 AND slug LIKE $2`, [site, `${base}%`]);
  const taken = new Set(rows.map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

// ── OpenStreetMap import ────────────────────────────────────────────────────

const OVERPASS = (process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter,https://overpass.kumi.systems/api/interpreter").split(",");

function cleanPhone(p?: string) {
  if (!p) return null;
  const first = p.split(/[;,]/)[0].trim();
  const d = first.replace(/[^\d]/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : first.slice(0, 30) || null;
}
function cleanUrl(u?: string) {
  if (!u) return null;
  const s = u.split(";")[0].trim();
  if (!s) return null;
  const full = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try { const x = new URL(full); return /\./.test(x.hostname) ? x.toString().slice(0, 300) : null; } catch { return null; }
}
/** One Overpass query, trying each server in turn; throws when all of them fail (so the group is retried later, not marked done). */
async function overpass(q: string) {
  let last = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ExpressNews-Directory/1.0" }, body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(330000) });
      if (r.ok) {
        const j = await r.json().catch(() => null);
        if (j && Array.isArray(j.elements)) {
          if (j.remark && /error|timed out|out of memory/i.test(j.remark) && !j.elements.length) last = `${url}: ${j.remark}`;
          else return j.elements as Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
        } else last = `${url}: bad JSON`;
      } else last = `${url}: HTTP ${r.status}`;
    } catch (e) { last = `${url}: ${String(e).slice(0, 120)}`; }
    await new Promise((res) => setTimeout(res, 10000));
  }
  throw new Error(`Overpass failed: ${last}`);
}

const dist = (a: number, b: number, c: number, d: number) => Math.hypot(a - c, (b - d) * Math.cos((a * Math.PI) / 180)) * 111;

/** Import one state's businesses from OpenStreetMap. Runs in the background (minutes for big states). */
export async function importState(abbr: string): Promise<{ found: number; saved: number }> {
  await dirSchema();
  const site = Object.values(sites).find((s) => s.stateAbbr === abbr);
  if (!site) throw new Error(`unknown state ${abbr}`);
  // resumable: a redeploy mid-import continues from the last finished category group
  const { rows: prev } = await pool.query(`SELECT status, groups_done, found, saved FROM directory_imports WHERE state = $1`, [abbr]);
  const resume = prev[0] && ["running", "queued", "error"].includes(prev[0].status);
  await pool.query(`INSERT INTO directory_imports (state, status, started_at, heartbeat) VALUES ($1, 'running', now(), now())
    ON CONFLICT (state) DO UPDATE SET status = 'running', heartbeat = now(), finished_at = NULL, error = NULL,
      started_at = CASE WHEN $2 THEN directory_imports.started_at ELSE now() END,
      groups_done = CASE WHEN $2 THEN directory_imports.groups_done ELSE '{}' END`, [abbr, !!resume]);
  const done: string[] = resume ? prev[0].groups_done || [] : [];
  const cities = citiesOf(site.state);
  let found = resume ? prev[0].found || 0 : 0, saved = resume ? prev[0].saved || 0 : 0;
  try {
    // one query per category group keeps each response a reasonable size
    const groups = Array.from(new Set(DIR_CATEGORIES.map((c) => c.group)));
    for (const g of groups) {
      if (done.includes(g)) continue;
      await pool.query(`UPDATE directory_imports SET heartbeat = now() WHERE state = $1`, [abbr]);
      const filters = Array.from(new Set(DIR_CATEGORIES.filter((c) => c.group === g).flatMap((c) => c.osm)));
      // one query per OSM tag, only elements that have a phone or a website: small, fast responses
      type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
      const elements: El[] = [];
      for (const f of filters) {
        const [k, v] = f.split("=");
        const q = `[out:json][timeout:300];area["ISO3166-2"="US-${abbr}"][admin_level=4]->.s;nwr(area.s)["name"]["${k}"="${v}"][~"^(phone|contact:phone|website|contact:website)$"~"."];out center tags;`;
        elements.push(...(await overpass(q)));
        await pool.query(`UPDATE directory_imports SET heartbeat = now() WHERE state = $1`, [abbr]);
        await new Promise((res) => setTimeout(res, 3000));
      }
      const json = { elements };
      for (const el of json?.elements || []) {
        const t = el.tags || {};
        const phone = cleanPhone(t.phone || t["contact:phone"]);
        const website = cleanUrl(t.website || t["contact:website"] || t.url);
        if (!t.name || (!phone && !website)) continue;
        const cat = categorize(t);
        if (!cat || cat.group !== g) continue;
        found++;
        const lat = el.lat ?? el.center?.lat ?? null, lon = el.lon ?? el.center?.lon ?? null;
        let city = (t["addr:city"] || "").trim();
        if (!city && lat != null && lon != null && cities.length) {
          const near = cities.map(([n, a, b]) => [n, dist(lat, lon, a, b)] as const).sort((x, y) => x[1] - y[1])[0];
          if (near && near[1] < 40) city = near[0];
        }
        if (!city || city.length > 40) continue;
        city = city.replace(/\b\w/g, (c) => c.toUpperCase());
        const citySlug = slugOf(city);
        const address = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ") || null;
        const osmId = `${el.type[0]}${el.id}`;
        const exists = await pool.query(`SELECT id FROM businesses WHERE osm_id = $1`, [osmId]);
        if (exists.rows[0]) {
          await pool.query(`UPDATE businesses SET name = $2, category = $3, phone = COALESCE($4, phone), website = COALESCE($5, website), hours = COALESCE($6, hours), address = COALESCE($7, address), updated_at = now()
            WHERE osm_id = $1 AND NOT claimed`, [osmId, t.name, cat.slug, phone, website, t.opening_hours || null, address]);
        } else {
          const slug = await uniqueSlug(site.slug, t.name, citySlug);
          await pool.query(
            `INSERT INTO businesses (site_slug, slug, osm_id, name, category, city, city_slug, address, zip, lat, lon, phone, website, hours, facebook, instagram)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT DO NOTHING`,
            [site.slug, slug, osmId, t.name.slice(0, 160), cat.slug, city, citySlug, address, t["addr:postcode"] || null, lat, lon, phone, website, (t.opening_hours || "").slice(0, 200) || null, cleanUrl(t["contact:facebook"]), cleanUrl(t["contact:instagram"])]
          );
          saved++;
        }
      }
      await pool.query(`UPDATE directory_imports SET found = $2, saved = $3, heartbeat = now(), groups_done = array_append(groups_done, $4) WHERE state = $1`, [abbr, found, saved, g]);
      await new Promise((res) => setTimeout(res, 8000)); // be polite to the public Overpass server
    }
    await pool.query(`UPDATE directory_imports SET status = 'done', found = $2, saved = $3, finished_at = now() WHERE state = $1`, [abbr, found, saved]);
  } catch (e) {
    await pool.query(`UPDATE directory_imports SET status = 'error', error = $2, finished_at = now() WHERE state = $1`, [abbr, String(e).slice(0, 500)]);
    throw e;
  }
  return { found, saved };
}

/** Owner-supplied fields that may be written to a listing. */
export const EDITABLE = ["name", "category", "city", "address", "zip", "phone", "website", "hours", "description", "facebook", "instagram", "photo_url"] as const;

/** Apply an approved claim (or a paid Spotlight's claim): the owner's fields, marked claimed. */
export async function applyClaim(claimId: number) {
  await dirSchema();
  const { rows } = await pool.query(`SELECT * FROM business_claims WHERE id = $1 AND status = 'pending'`, [claimId]);
  const c = rows[0];
  if (!c) return false;
  const d = c.data as Record<string, string>;
  const sets: string[] = [], args: unknown[] = [c.business_id];
  for (const k of EDITABLE) if (d[k]) { args.push(d[k]); sets.push(`${k} = $${args.length}`); }
  if (d.city) { args.push(slugOf(d.city)); sets.push(`city_slug = $${args.length}`); }
  args.push(c.email); sets.push(`owner_email = $${args.length}`);
  await pool.query(`UPDATE businesses SET ${sets.join(", ")}, claimed = TRUE, status = 'active', source = CASE WHEN source = 'osm' THEN 'osm+owner' ELSE source END, updated_at = now() WHERE id = $1`, args);
  await pool.query(`UPDATE business_claims SET status = 'applied' WHERE id = $1`, [claimId]);
  // welcome email with the dashboard link (the owner asked to be listed, so this is expected)
  const { sendOwnerWelcome } = await import("@/lib/directory-owner");
  await sendOwnerWelcome(c.site_slug, c.business_id).catch(() => null);
  return true;
}

/** Queue states for import; the cron works through the queue one state at a time. */
export async function queueImports(states: string[]) {
  await dirSchema();
  for (const s of states) await pool.query(`INSERT INTO directory_imports (state, status, groups_done) VALUES ($1, 'queued', '{}')
    ON CONFLICT (state) DO UPDATE SET status = 'queued', groups_done = '{}', found = 0, saved = 0, error = NULL, finished_at = NULL`, [s]);
}

let importing = false;
/** Cron tick: continue an interrupted import, or start the next queued state. */
export async function importTick(): Promise<string | null> {
  if (importing) return "busy";
  await dirSchema();
  const { rows } = await pool.query(`SELECT state FROM directory_imports
    WHERE status = 'queued' OR (status = 'running' AND (heartbeat IS NULL OR heartbeat < now() - interval '45 minutes'))
       OR (status = 'error' AND finished_at < now() - interval '30 minutes')
    ORDER BY (status = 'running') DESC, started_at NULLS LAST LIMIT 1`);
  if (!rows[0]) return null;
  importing = true;
  importState(rows[0].state).catch((e) => console.error("directory import", rows[0].state, e)).finally(() => { importing = false; });
  return rows[0].state;
}

export { catBySlug };

// ── Photos and neighbours for the business pages ─────────────────────────────

/** One free photo per category (Pexels, stored on our CDN once), credited. */
export async function categoryPhoto(category: string): Promise<{ url: string; credit: string } | null> {
  await dirSchema();
  await pool.query(`CREATE TABLE IF NOT EXISTS directory_cat_photos (category VARCHAR(60) PRIMARY KEY, url TEXT, credit TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
  const { rows } = await pool.query(`SELECT url, credit FROM directory_cat_photos WHERE category = $1`, [category]);
  if (rows[0]) return rows[0].url ? rows[0] : null;
  const cat = catBySlug(category);
  if (!cat) return null;
  const { searchPexels } = await import("@/lib/pipeline/images");
  const { storeImage } = await import("@/lib/pipeline/image-store");
  const img = await searchPexels(cat.name.replace(/&/g, "and")).catch(() => null);
  const url = img?.url ? (await storeImage(img.url, `${cat.name} directory`, true).catch(() => null)) || img.url : null;
  await pool.query(`INSERT INTO directory_cat_photos (category, url, credit) VALUES ($1,$2,$3) ON CONFLICT (category) DO NOTHING`, [category, url, img?.credit || null]);
  return url ? { url, credit: img?.credit || "" } : null;
}

/** Businesses near a point (any category), nearest first, with the distance in miles. */
export async function nearby(site: string, lat: number, lon: number, exceptId: number, limit = 6) {
  await dirSchema();
  const { rows } = await pool.query(
    `SELECT *, (($2 - lat) * ($2 - lat) + (($3 - lon) * cos(radians($2))) * (($3 - lon) * cos(radians($2)))) AS d2
       FROM businesses WHERE site_slug = $1 AND status = 'active' AND id <> $4 AND lat BETWEEN $2 - 0.04 AND $2 + 0.04 AND lon BETWEEN $3 - 0.05 AND $3 + 0.05
      ORDER BY d2 LIMIT $5`,
    [site, lat, lon, exceptId, limit]
  );
  return (rows as Array<Business & { d2: number }>).map((b) => ({ ...b, miles: Math.sqrt(b.d2) * 69 }));
}

/** The paper's stories that name the business (title or text), newest first. */
export async function storiesAbout(site: string, name: string, limit = 4) {
  if (name.length < 6 || /^(the |a )?(bank|church|store|restaurant|cafe|bar|pizza|salon)$/i.test(name)) return [];
  const { rows } = await pool.query(
    `SELECT a.title, a.slug, a.category, a.published_at FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.category NOT IN ('guides', 'sponsored') AND a.title ILIKE $2 AND a.published_at > now() - interval '365 days'
      ORDER BY a.published_at DESC LIMIT $3`,
    [site, `%${name.replace(/[%_]/g, "")}%`, limit]
  ).catch(() => ({ rows: [] }));
  return rows as Array<{ title: string; slug: string; category: string; published_at: string }>;
}

export type Deal = { id: number; business_id: number; title: string; details: string | null; code: string | null; expires_at: string };
/** Live deals: for one business, or the state (optionally one town), newest first. */
export async function liveDeals(site: string, opts: { businessId?: number; city?: string; limit?: number } = {}) {
  await dirSchema();
  const args: unknown[] = [site]; const where = ["d.site_slug = $1", "d.status = 'live'", "d.expires_at >= current_date", "b.status = 'active'"];
  if (opts.businessId) { args.push(opts.businessId); where.push(`d.business_id = $${args.length}`); }
  if (opts.city) { args.push(opts.city); where.push(`b.city_slug = $${args.length}`); }
  args.push(opts.limit ?? 60);
  const { rows } = await pool.query(`SELECT d.*, b.name AS biz_name, b.slug AS biz_slug, b.city, b.city_slug, b.category, b.phone FROM business_deals d JOIN businesses b ON b.id = d.business_id WHERE ${where.join(" AND ")} ORDER BY d.created_at DESC LIMIT $${args.length}`, args);
  return rows as Array<Deal & { biz_name: string; biz_slug: string; city: string; city_slug: string; category: string; phone: string | null }>;
}

// ── Top 10 ranking (shared by the Best pages and the owner page) ──
export type Ranked = Business & { score: number; why: string[] };

export async function rank(site: string, city: string, category: string): Promise<Ranked[]> {
  await dirSchema();
  const { rows } = await pool.query(`SELECT * FROM businesses WHERE site_slug = $1 AND city_slug = $2 AND category = $3 AND status = 'active' LIMIT 400`, [site, city, category]);
  const seen = new Set<string>();
  const out: Ranked[] = [];
  for (const b of rows as Business[]) {
    const key = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) continue; // one place per chain
    seen.add(key);
    const why: string[] = [];
    // Bayesian average: 3.5 stars with the weight of 3 reviews, plus the real reviews
    const bayes = (3.5 * 3 + b.rating_sum) / (3 + b.rating_count);
    let score = bayes * 20;
    if (b.rating_count) why.push(`${ratingOf(b)}★ from ${b.rating_count} review${b.rating_count === 1 ? "" : "s"}`);
    if (_parseHours(b.hours)) { score += 6; why.push("hours listed"); }
    if (b.phone) score += 4;
    if (b.website) { score += 4; why.push("website"); }
    if (b.description) { score += 5; why.push("owner description"); }
    if (b.claimed) { score += 6; why.push("verified owner"); }
    out.push({ ...b, score, why });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}
