import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return (match?.[1] || match?.[2] || "").trim();
}

function extractAllItems(xml: string): string[] {
  const items: string[] = [];
  let start = 0;
  while (true) {
    const itemStart = xml.indexOf("<item>", start);
    if (itemStart === -1) break;
    const itemEnd = xml.indexOf("</item>", itemStart);
    if (itemEnd === -1) break;
    items.push(xml.substring(itemStart, itemEnd + 7));
    start = itemEnd + 7;
  }
  return items;
}

function extractCategories(item: string): string[] {
  const cats: string[] = [];
  const regex = /<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/gi;
  let match;
  while ((match = regex.exec(item)) !== null) {
    cats.push(match[1]);
  }
  return cats;
}

function extractFeaturedImage(item: string): string {
  // Try FIFU plugin meta
  const fifuMatch = item.match(/<meta_key>fifu_image_url<\/meta_key>\s*<meta_value><!\[CDATA\[(.*?)\]\]><\/meta_value>/i);
  if (fifuMatch) return fifuMatch[1];

  // Try wp:attachment_url
  const attachMatch = item.match(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/i);
  if (attachMatch) return attachMatch[1];

  // Try enclosure
  const encMatch = item.match(/<enclosure[^>]+url="([^"]+)"/i);
  if (encMatch) return encMatch[1];

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const siteSlug = formData.get("site") as string;

    if (!file || !siteSlug) {
      return NextResponse.json({ error: "File and site required" }, { status: 400 });
    }

    const siteConfig = sites[siteSlug];
    if (!siteConfig) {
      return NextResponse.json({ error: "Site not found" }, { status: 400 });
    }

    // Get or create site in DB
    let siteId: number;
    const { rows: existing } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (existing.length > 0) {
      siteId = existing[0].id;
    } else {
      const { rows: inserted } = await pool.query(
        `INSERT INTO sites (slug, domain, name, logo_first, logo_second, city, state, state_abbr, tagline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [siteConfig.slug, siteConfig.domain, siteConfig.name, siteConfig.logoFirst, siteConfig.logoSecond,
         siteConfig.city, siteConfig.state, siteConfig.stateAbbr, siteConfig.tagline]
      );
      siteId = inserted[0].id;
    }

    // Parse XML
    const xmlContent = await file.text();
    const items = extractAllItems(xmlContent);

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      // Only import posts (not pages, attachments, etc.)
      const postType = extractTag(item, "wp:post_type");
      if (postType && postType !== "post") {
        skipped++;
        continue;
      }

      const status = extractTag(item, "wp:status");
      if (status && status !== "publish") {
        skipped++;
        continue;
      }

      const title = extractTag(item, "title");
      const slug = extractTag(item, "wp:post_name") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const content = extractTag(item, "content:encoded");
      const summary = extractTag(item, "excerpt:encoded");
      const pubDate = extractTag(item, "wp:post_date") || extractTag(item, "pubDate");
      const author = extractTag(item, "dc:creator");
      const wpId = parseInt(extractTag(item, "wp:post_id")) || null;

      const categories = extractCategories(item);
      const category = categories[0]?.toLowerCase().replace(/\s+/g, "-") || "general";

      const featuredImage = extractFeaturedImage(item);

      if (!title) {
        skipped++;
        continue;
      }

      try {
        const { rowCount } = await pool.query(
          `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, wp_original_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, title, slug, content, summary, category, author || "Staff Reporter", featuredImage, pubDate || new Date().toISOString(), wpId]
        );

        if ((rowCount ?? 0) > 0) imported++;
        else skipped++;
      } catch {
        skipped++;
      }

      // Import categories
      for (const cat of categories) {
        const catSlug = cat.toLowerCase().replace(/\s+/g, "-");
        await pool.query(
          `INSERT INTO categories (site_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, cat, catSlug]
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      site: siteSlug,
      imported,
      skipped,
      total: items.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
