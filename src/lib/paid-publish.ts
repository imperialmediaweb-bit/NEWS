import pool from "@/lib/db";
import { sites } from "@/config/sites";

/**
 * Publish a paid order as an article on its paper: sponsored stories, featured
 * stories, Business Spotlight profiles (clearly labelled as paid, links
 * rel="sponsored") and obituaries. Used by /admin/paid (Publish) and by the
 * cron that auto-publishes Spotlight profiles 24 hours after payment.
 */
export type PaidOrder = {
  id: number; site_slug: string; product: string; title: string; body: string; business: string | null; website: string | null;
  name: string; photo_url: string | null; status: string; business_id?: number | null;
};
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

export async function publishPaidOrder(o: PaidOrder): Promise<string | null> {
  const { rows: s } = await pool.query("SELECT id FROM sites WHERE slug = $1", [o.site_slug]);
  if (!s[0]) return null;
  const site = sites[o.site_slug];
  const monthly = o.product === "monthly_article" || o.product === "news_brief";
  const spotlight = o.product === "spotlight" || o.product === "spotlight_home" || monthly;
  const release = o.product === "press_release";
  const sponsored = spotlight || release || o.product === "sponsored" || o.product === "featured";
  const paras = o.body.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("\n");
  let bizLink = "";
  if (spotlight && o.business_id) {
    const { rows: b } = await pool.query("SELECT slug FROM businesses WHERE id = $1", [o.business_id]);
    if (b[0]) bizLink = `\n<p><a href="/directory/listing/${esc(b[0].slug)}">See ${esc(o.business || "the business")} in the ${esc(site?.state || "")} business directory</a></p>`;
  }
  const label = release
    ? `<p><em>Press release from ${esc(o.business || o.name)}, published as submitted. ${esc(o.business || o.name)} paid ${esc(site?.name || "")} to publish it; the newsroom did not write or verify it.</em></p>`
    : spotlight
    ? `<p><em>Business Spotlight: sponsored content. ${esc(o.business || o.name)} paid ${esc(site?.name || "")} to publish this ${monthly ? "article" : "profile"}, written from information the business provided. The newsroom did not report it.</em></p>`
    : `<p><em>Sponsored content from ${esc(o.business || o.name)}. ${esc(site?.name || "")} was paid to publish it; the newsroom did not write it.</em></p>`;
  const content = sponsored
    ? `${label}\n${paras}${o.website ? `\n<p><a href="${esc(o.website)}" rel="sponsored noopener" target="_blank">Visit ${esc(o.business || "the website")}</a></p>` : ""}${bizLink}`
    : paras;
  const slug = `${slugify(o.title)}-${o.id}`;
  const category = sponsored ? "sponsored" : "obituaries";
  await pool.query(
    `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, source_url, auto_generated)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),NULL,false) ON CONFLICT (site_id, slug) DO NOTHING`,
    [s[0].id, o.title, slug, content, o.body.replace(/\s+/g, " ").slice(0, 155), category, release ? "Press Release" : sponsored ? "Sponsored Content" : "Obituary", o.photo_url]
  );
  await pool.query("UPDATE paid_orders SET status = 'published', article_slug = $2, published_at = now() WHERE id = $1", [o.id, `${category}/${slug}`]);
  if (spotlight && !monthly && o.business_id) await pool.query("UPDATE businesses SET article_slug = $2, updated_at = now() WHERE id = $1", [o.business_id, `${category}/${slug}`]).catch(() => null);
  return `${category}/${slug}`;
}

/** Cron: Spotlight profiles go live 24 hours after payment unless the editor declined them. */
export async function autoPublishSpotlights(): Promise<number> {
  const { rows } = await pool.query(`SELECT * FROM paid_orders WHERE product IN ('spotlight', 'spotlight_home', 'monthly_article', 'news_brief') AND status = 'paid' AND auto_publish_at IS NOT NULL AND auto_publish_at < now() LIMIT 20`).catch(() => ({ rows: [] }));
  let n = 0;
  for (const o of rows as PaidOrder[]) if (await publishPaidOrder(o)) n++;
  return n;
}
