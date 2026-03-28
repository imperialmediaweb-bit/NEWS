import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { submitToIndexNow } from "@/lib/indexnow";

const WP_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Referer": "https://www.google.com/",
};

async function tryFetch(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: WP_HEADERS,
        signal: AbortSignal.timeout(30000),
        redirect: "follow",
      });
      if (res.ok) return res;
      if (res.status === 403 || res.status === 503) {
        // Cloudflare block — wait and retry
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      if (res.status === 404 || res.status === 400) return null;
    } catch {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { siteSlug, page = 1 } = await request.json();

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

    // Try multiple URL patterns
    const urlPatterns = [
      `https://www.${siteConfig.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`,
      `https://${siteConfig.domain}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`,
    ];

    let res: Response | null = null;
    for (const url of urlPatterns) {
      res = await tryFetch(url);
      if (res) break;
    }

    if (!res) {
      return NextResponse.json({
        siteSlug,
        page,
        imported: 0,
        skipped: 0,
        totalPages: 0,
        done: true,
        error: "Could not access WordPress API (Cloudflare blocking)",
      });
    }

    const totalPages = parseInt(res.headers.get("x-wp-totalpages") || res.headers.get("X-WP-TotalPages") || "0") || 0;
    const posts = await res.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ siteSlug, page, imported: 0, skipped: 0, totalPages, done: true });
    }

    let imported = 0;
    let skipped = 0;

    for (const post of posts) {
      const title = (post.title?.rendered || "").replace(/<[^>]*>/g, "").trim();
      if (!title) { skipped++; continue; }

      const content = post.content?.rendered || "";
      const summary = (post.excerpt?.rendered || "").replace(/<[^>]*>/g, "").trim();
      const author = post._embedded?.author?.[0]?.name || "Staff Reporter";
      const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
      const category = post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "general";

      try {
        const { rowCount } = await pool.query(
          `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, wp_original_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (site_id, slug) DO NOTHING`,
          [siteId, title, post.slug, content, summary, category, author, featuredImage, post.date, post.id]
        );
        if ((rowCount ?? 0) > 0) imported++;
        else skipped++;
      } catch {
        skipped++;
      }
    }

    // Submit newly imported articles to IndexNow for instant indexing
    if (imported > 0) {
      const importedUrls = posts
        .filter((post: Record<string, unknown>) => post.slug)
        .map(
          (post: Record<string, unknown>) =>
            `https://${siteConfig.domain}/${post.slug}`
        );

      submitToIndexNow(siteConfig.domain, importedUrls).catch(() => {
        // IndexNow submission is best-effort; don't block the response
      });
    }

    return NextResponse.json({
      siteSlug,
      page,
      imported,
      skipped,
      totalPages,
      done: page >= totalPages,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
