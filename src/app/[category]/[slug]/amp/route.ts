import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import pool from "@/lib/db";

function getSiteFromHeaders() {
  try {
    const headersList = headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    const detected = getSiteByDomain(host);
    return detected || getActiveSite();
  } catch {
    return getActiveSite();
  }
}

/**
 * AMP version of article pages.
 * Google News and Google Search prefer AMP for mobile — loads instantly.
 * Strips all JS, uses AMP-specific tags for images and analytics.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { category: string; slug: string } }
) {
  const site = getSiteFromHeaders();

  // Fetch article from DB
  const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
  if (siteRows.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { rows: articleRows } = await pool.query(
    "SELECT * FROM articles WHERE site_id = $1 AND slug = $2 LIMIT 1",
    [siteRows[0].id, params.slug]
  );

  if (articleRows.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const article = articleRows[0];
  const title = article.title as string;
  const content = (article.content as string) || "";
  const summary = (article.summary as string) || "";
  const author = (article.author as string) || "Staff Reporter";
  const image = (article.featured_image as string) || "";
  const publishedAt = article.published_at ? new Date(article.published_at).toISOString() : "";
  const category = (article.category as string) || "news";
  const canonicalUrl = `https://${site.domain}/${category}/${params.slug}`;

  // Convert regular img tags to amp-img
  const ampContent = content
    .replace(/<img([^>]*?)src="([^"]*)"([^>]*?)>/gi, (_, before, src, after) => {
      const altMatch = (before + after).match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : title;
      return `<amp-img src="${src}" alt="${alt}" width="1200" height="675" layout="responsive"></amp-img>`;
    })
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");

  const ampHtml = `<!doctype html>
<html amp lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <title>${escapeHtml(title)} | ${site.name}</title>
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${escapeHtml(summary)}">
  <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
  <script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;animation:none}</style></noscript>

  <style amp-custom>
    /* Standalone AMP document — the site's state colour must be declared
       here, it cannot inherit the CSS variable from the main layout. */
    :root { --accent: ${site.accent}; --accent-dark: ${site.accentDark}; }
    body { font-family: Georgia, serif; margin: 0; padding: 0; background: #fff; color: #222; }
    .header { background: #000; padding: 12px 20px; text-align: center; }
    .header a { color: #fff; text-decoration: none; font-family: 'Helvetica Neue', sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 2px; }
    .header span { color: var(--accent); }
    .article { max-width: 700px; margin: 0 auto; padding: 20px; }
    .category { display: inline-block; background: var(--accent); color: #fff; padding: 4px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-family: sans-serif; }
    h1 { font-size: 28px; line-height: 1.3; margin: 0 0 12px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; font-family: sans-serif; border-bottom: 1px solid #eee; padding-bottom: 12px; }
    .meta strong { color: #333; }
    .content { font-size: 18px; line-height: 1.8; }
    .content p { margin: 0 0 18px; }
    .content h2 { font-size: 22px; margin: 28px 0 12px; }
    .content h3 { font-size: 18px; margin: 24px 0 10px; }
    .content a { color: var(--accent); }
    .content amp-img { margin: 16px 0; border-radius: 4px; }
    .share { margin: 24px 0; display: flex; gap: 8px; }
    .footer { background: #111; color: #666; text-align: center; padding: 20px; font-size: 13px; font-family: sans-serif; margin-top: 40px; }
    .footer a { color: var(--accent); text-decoration: none; }
  </style>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": ${JSON.stringify(title)},
    "description": ${JSON.stringify(summary)},
    "image": ${image ? `[{"@type":"ImageObject","url":${JSON.stringify(image)},"width":1200,"height":675}]` : "[]"},
    "datePublished": "${publishedAt}",
    "dateModified": "${publishedAt}",
    "author": { "@type": "Person", "name": ${JSON.stringify(author)} },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": ${JSON.stringify(site.name)},
      "logo": { "@type": "ImageObject", "url": "https://${site.domain}/api/favicon?site=${site.slug}" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${canonicalUrl}" }
  }
  </script>
</head>
<body>

  <header class="header">
    <a href="https://${site.domain}">${site.logoFirst} <span>${site.logoSecond}</span></a>
  </header>

  <article class="article">
    <div class="category">${escapeHtml(category.replace(/-/g, " "))}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      By <strong>${escapeHtml(author)}</strong>${publishedAt ? ` &bull; ${new Date(publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}
    </div>

    ${image ? `<amp-img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="1200" height="675" layout="responsive"></amp-img>` : ""}

    <div class="content">
      ${ampContent}
    </div>

    <div class="share">
      <amp-social-share type="twitter" width="40" height="40"></amp-social-share>
      <amp-social-share type="facebook" width="40" height="40"></amp-social-share>
      <amp-social-share type="linkedin" width="40" height="40"></amp-social-share>
      <amp-social-share type="email" width="40" height="40"></amp-social-share>
    </div>
  </article>

  <footer class="footer">
    &copy; ${new Date().getFullYear()} <a href="https://${site.domain}">${site.name}</a>. All rights reserved.
    <br>A <a href="https://media-chief.com">MediaChief</a> publication.
  </footer>

  <amp-analytics type="gtag" data-credentials="include">
    <script type="application/json">
    {
      "vars": { "gtag_id": "G-7QTZR437CQ", "config": { "G-7QTZR437CQ": { "groups": "default" } } }
    }
    </script>
  </amp-analytics>

</body>
</html>`;

  return new NextResponse(ampHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "AMP-Access-Control-Allow-Source-Origin": `https://${site.domain}`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
