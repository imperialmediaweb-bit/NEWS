import pool from "@/lib/db";
import { sites as siteConfigs } from "@/config/sites";
import type { SiteConfig } from "@/config/site-config";

/**
 * slug -> sites.id, cached in process.
 *
 * Every public route was running `SELECT id FROM sites WHERE slug = $1` on
 * every request (15+ call sites). The `sites` table holds 50 rows that never
 * change, so one round trip per request was pure waste.
 */
const cache = new Map<string, number>();

export async function getSiteId(slug: string): Promise<number | null> {
  const cached = cache.get(slug);
  if (cached !== undefined) return cached;

  const { rows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [slug]);
  if (rows.length > 0) {
    cache.set(slug, rows[0].id);
    return rows[0].id;
  }
  return null;
}

/**
 * Same, but seeds the row from config if it is missing (self-heal for a
 * sites table that was never populated).
 */
export async function getOrCreateSiteId(config: SiteConfig): Promise<number | null> {
  const existing = await getSiteId(config.slug);
  if (existing !== null) return existing;

  try {
    const { rows } = await pool.query(
      `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET domain = EXCLUDED.domain
       RETURNING id`,
      [config.slug, config.domain, config.name, config.logoFirst, config.logoSecond,
       config.city, config.state, config.stateAbbr, config.tagline]
    );
    const id = rows[0]?.id ?? null;
    if (id !== null) cache.set(config.slug, id);
    return id;
  } catch (e) {
    console.error("getOrCreateSiteId failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Resolve a site id straight from a slug present in config. */
export async function getSiteIdBySlug(slug: string): Promise<number | null> {
  const cfg = siteConfigs[slug];
  return cfg ? getOrCreateSiteId(cfg) : getSiteId(slug);
}
