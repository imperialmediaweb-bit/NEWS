import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.summary, a.featured_image, a.category, a.slug, a.published_at, a.author, s.slug as site_slug
       FROM articles a
       JOIN sites s ON a.site_id = s.id
       WHERE a.slug = $1 AND a.featured_image IS NOT NULL AND a.featured_image != ''
       LIMIT 1`,
      [slug]
    );

    if (rows.length === 0) {
      return new NextResponse("Story not found", { status: 404 });
    }

    const article = rows[0] as Record<string, unknown>;
    const title = escapeHtml(article.title as string);
    const summary = escapeHtml((article.summary as string) || "Read the full article for more details.");
    const featuredImage = article.featured_image as string;
    const category = escapeHtml((article.category as string) || "news");
    const author = escapeHtml((article.author as string) || "Staff Reporter");
    const publishedAt = article.published_at as string;
    const articleSlug = article.slug as string;
    const siteSlug = article.site_slug as string;

    const publisherName = siteSlug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const ampHtml = `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <title>${title}</title>
  <link rel="canonical" href="/web-stories/${articleSlug}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    .cover-heading { font-size: 1.8em; font-weight: 900; line-height: 1.2; text-transform: uppercase; }
    .category-badge { display: inline-block; background: #e00; color: #fff; font-size: 0.75em; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 4px; margin-bottom: 8px; }
    .meta { color: rgba(255,255,255,0.7); font-size: 0.85em; margin-top: 8px; }
    .summary-text { font-size: 1.3em; line-height: 1.6; color: #fff; text-align: center; }
    .divider { width: 50px; height: 3px; background: #e00; margin: 16px auto; }
    .cta-heading { font-size: 2em; font-weight: 900; color: #fff; margin-bottom: 12px; }
    .cta-button { display: inline-block; background: #fff; color: #000; font-weight: 700; font-size: 1.1em; padding: 14px 32px; border-radius: 50px; text-decoration: none; }
  </style>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebStory",
    "name": "${title}",
    "headline": "${title}",
    "description": "${summary}",
    "image": "${featuredImage}",
    "datePublished": "${publishedAt}",
    "author": {
      "@type": "Person",
      "name": "${author}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${escapeHtml(publisherName)}"
    }
  }
  </script>
</head>
<body>
  <amp-story
    standalone
    title="${title}"
    publisher="${escapeHtml(publisherName)}"
    poster-portrait-src="${featuredImage}"
  >
    <!-- Page 1: Cover -->
    <amp-story-page id="cover">
      <amp-story-grid-layer template="fill">
        <amp-img
          src="${featuredImage}"
          width="720"
          height="1280"
          layout="responsive"
          alt="${title}"
        ></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="bottom">
        <div>
          <span class="category-badge">${category}</span>
          <h1 class="cover-heading">${title}</h1>
          <p class="meta">${author} &middot; ${new Date(publishedAt as string).toLocaleDateString()}</p>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>

    <!-- Page 2: Summary -->
    <amp-story-page id="summary" auto-advance-after="5s">
      <amp-story-grid-layer template="fill" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);">
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;">
          <div class="divider"></div>
          <p class="summary-text">${summary}</p>
          <div class="divider"></div>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>

    <!-- Page 3: CTA -->
    <amp-story-page id="cta" auto-advance-after="5s">
      <amp-story-grid-layer template="fill" style="background: linear-gradient(135deg, #0f3460 0%, #533483 50%, #e94560 100%);">
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
          <h2 class="cta-heading">Want the full story?</h2>
          <a class="cta-button" href="/${category}/${articleSlug}">Read Full Article</a>
        </div>
      </amp-story-grid-layer>
    </amp-story-page>
  </amp-story>
</body>
</html>`;

    return new NextResponse(ampHtml, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
