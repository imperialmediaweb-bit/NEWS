import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";

interface WPPost {
  id: number;
  title: { rendered: string };
  slug: string;
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  featured_media: number;
  categories: number[];
  _embedded?: {
    author?: Array<{ name: string }>;
    "wp:featuredmedia"?: Array<{ source_url: string }>;
    "wp:term"?: Array<Array<{ name: string; slug: string }>>;
  };
}

const WP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: WP_HEADERS,
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return res;
      if (res.status === 404) return null;
    } catch {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return null;
}

async function importSite(siteSlug: string): Promise<{
  site: string;
  status: "success" | "error";
  imported: number;
  skipped: number;
  message?: string;
}> {
  const siteConfig = sites[siteSlug];
  if (!siteConfig) {
    return { site: siteSlug, status: "error", imported: 0, skipped: 0, message: "Site not found in config" };
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

  // Import categories first
  try {
    const catRes = await fetchWithRetry(`https://${siteConfig.domain}/wp-json/wp/v2/categories?per_page=100`);
    if (catRes) {
      const categories = await catRes.json();
      for (const cat of categories) {
        await pool.query(
          `INSERT INTO categories (site_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, cat.name, cat.slug]
        );
      }
    }
  } catch { /* categories optional */ }

  // Import articles page by page
  let imported = 0;
  let skipped = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${siteConfig.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`;
    const res = await fetchWithRetry(url);

    if (!res) {
      if (page === 1) {
        return { site: siteSlug, status: "error", imported, skipped, message: "WordPress REST API not accessible" };
      }
      break;
    }

    const posts: WPPost[] = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) break;

    for (const post of posts) {
      const title = post.title.rendered.replace(/<[^>]*>/g, "").trim();
      const content = post.content.rendered;
      const summary = post.excerpt.rendered.replace(/<[^>]*>/g, "").trim();
      const author = post._embedded?.author?.[0]?.name || "Staff Reporter";
      const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
      const category = post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "general";

      const { rowCount } = await pool.query(
        `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, wp_original_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (site_id, slug) DO NOTHING`,
        [siteId, title, post.slug, content, summary, category, author, featuredImage, post.date, post.id]
      );

      if ((rowCount ?? 0) > 0) imported++;
      else skipped++;
    }

    // Check total pages from header
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1");
    hasMore = page < totalPages;
    page++;

    // Rate limiting — don't hammer WordPress
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { site: siteSlug, status: "success", imported, skipped };
}

export async function POST(request: NextRequest) {
  try {
    const { sites: siteSlugs } = await request.json();
    if (!siteSlugs?.length) {
      return NextResponse.json({ error: "No sites selected" }, { status: 400 });
    }

    // Import sites sequentially to avoid overloading
    const results = [];
    for (const slug of siteSlugs) {
      const result = await importSite(slug);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
