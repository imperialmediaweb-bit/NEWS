import pool from "@/lib/db";
import { dirSchema, type Business } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { llmJson } from "@/lib/llm-json";
import { readSite } from "@/lib/site-reader";

/**
 * Business Website: a personal one-page site for a business on its paper
 * (/b/{slug}), $29/month or $249/year. The owner previews an AI-built draft
 * made from the listing and their own website (facts only), edits every
 * part (tagline, about, services with prices, FAQ, photos, theme, colour),
 * then pays to publish. It carries an AI assistant trained on that content
 * and a contact form that emails the business. Unpaid sites stay drafts
 * (noindex, visible only to the owner).
 */
export type Service = { name: string; price?: string; desc?: string };
export type Faq = { q: string; a: string };
export type BizSite = {
  business_id: number; site_slug: string; slug: string; theme: string; accent: string | null; tagline: string | null; about: string | null;
  services: Service[]; faqs: Faq[]; gallery: string[]; hero_url: string | null; cta_label: string | null; contact_email: string | null;
  status: string; plan: string | null; stripe_subscription: string | null; paid_until: string | null; updated_at: string;
};
export const THEMES = ["classic", "bold", "minimal"] as const;

let ready = false;
export async function siteSchema() {
  if (ready) return;
  await dirSchema();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_sites (
      business_id INT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE, site_slug VARCHAR(100) NOT NULL, slug TEXT NOT NULL,
      theme VARCHAR(20) NOT NULL DEFAULT 'classic', accent TEXT, tagline TEXT, about TEXT,
      services JSONB NOT NULL DEFAULT '[]', faqs JSONB NOT NULL DEFAULT '[]', gallery JSONB NOT NULL DEFAULT '[]',
      hero_url TEXT, cta_label TEXT, contact_email TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'draft', plan VARCHAR(10), stripe_subscription TEXT, paid_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (site_slug, slug)
    );
    CREATE TABLE IF NOT EXISTS business_ai_questions (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, q TEXT NOT NULL, answered BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS business_leads (
      id SERIAL PRIMARY KEY, business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, name TEXT, email TEXT, phone TEXT, message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  ready = true;
}

export async function getBizSite(site: string, slug: string): Promise<(BizSite & { business: Business }) | null> {
  await siteSchema();
  const { rows } = await pool.query(`SELECT s.*, row_to_json(b) AS business FROM business_sites s JOIN businesses b ON b.id = s.business_id WHERE s.site_slug = $1 AND s.slug = $2`, [site, slug]);
  return rows[0] || null;
}
export async function bizSiteFor(businessId: number): Promise<BizSite | null> {
  await siteSchema();
  const { rows } = await pool.query(`SELECT * FROM business_sites WHERE business_id = $1`, [businessId]);
  return rows[0] || null;
}
export const isLive = (s: Pick<BizSite, "status" | "paid_until">) => s.status === "active" && (!s.paid_until || new Date(s.paid_until) > new Date());

/** The AI-built first draft, from the listing and the business's own website only. */
export async function draftSite(b: Business): Promise<BizSite> {
  await siteSchema();
  const existing = await bizSiteFor(b.id);
  if (existing) return existing;
  const cat = catBySlug(b.category);
  const page = b.website ? await readSite(b.website).catch(() => null) : null;
  const out = await llmJson<{ tagline: string; about: string; services: Service[]; faqs: Faq[]; cta: string }>(
    `Build the content of a one-page website for a local business, from the FACTS only.
STRICT: no invented services, prices, years, awards, staff, guarantees or claims. Prices only if the website text states them. If you don't know something, leave it out.
Return JSON: {"tagline": "max 70 characters", "about": "2 short paragraphs separated by a blank line, third person", "services": [{"name": "...", "price": "only if stated, else empty", "desc": "one sentence"}] (3-8, only ones the facts mention), "faqs": [{"q": "...", "a": "..."}] (3-5, answered from the facts), "cta": "button text, e.g. Call for a free quote"}.
FACTS:
Name: ${b.name}
Type: ${cat?.name || b.category}
Town: ${b.city}
Address: ${b.address || ""}
Phone: ${b.phone || ""}
Hours: ${b.hours || ""}
Description: ${b.description || ""}
WEBSITE TEXT: ${page?.text?.slice(0, 7000) || "(none)"}`, 2500).catch(() => null);
  const slug = b.slug;
  await pool.query(
    `INSERT INTO business_sites (business_id, site_slug, slug, tagline, about, services, faqs, cta_label, contact_email) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (business_id) DO NOTHING`,
    [b.id, b.site_slug, slug, out?.tagline?.slice(0, 120) || `${cat?.name || "Local business"} in ${b.city}`, out?.about?.slice(0, 2500) || b.description || "",
      JSON.stringify((out?.services || []).slice(0, 12)), JSON.stringify((out?.faqs || []).slice(0, 10)), out?.cta?.slice(0, 40) || (b.phone ? "Call us" : "Contact us"), (b as unknown as { owner_email?: string }).owner_email || null]
  );
  return (await bizSiteFor(b.id))!;
}
