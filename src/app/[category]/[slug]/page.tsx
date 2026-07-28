import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import pool from "@/lib/db";
import ArticlePageClient from "@/components/ArticlePageClient";

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
 * Auto Internal Linking — injects contextual links to other articles
 * from the same site into the article content.
 * Inserts up to 5 links, placed after paragraphs, with natural anchor text.
 */
function injectInternalLinks(
  content: string,
  linkArticles: { title: string; slug: string; category: string }[],
  domain: string
): string {
  if (linkArticles.length === 0 || !content) return content;

  // Split content into paragraphs (by </p> tags)
  const paragraphs = content.split("</p>");
  if (paragraphs.length < 3) return content;

  // Pick up to 5 articles to link, spread evenly through the content
  const maxLinks = Math.min(5, linkArticles.length);
  const linksToInsert = linkArticles.slice(0, maxLinks);

  // Calculate insertion points — skip first and last paragraphs
  const insertableCount = paragraphs.length - 2; // skip first and last
  if (insertableCount < 1) return content;

  const step = Math.max(1, Math.floor(insertableCount / maxLinks));

  let linkIndex = 0;
  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    result.push(paragraphs[i]);
    if (i < paragraphs.length - 1) {
      result.push("</p>");
    }

    // Insert link after this paragraph (skip first paragraph, only on </p> boundaries)
    if (
      i > 0 &&
      i < paragraphs.length - 1 &&
      linkIndex < linksToInsert.length &&
      (i - 1) % step === 0
    ) {
      const link = linksToInsert[linkIndex];
      const href = `https://${domain}/${link.category}/${link.slug}`;
      const relatedBox = `<p style="margin:16px 0;padding:12px 16px;background:#f8f8f8;border-left:3px solid #c1121f;font-size:0.95em;"><strong>Related:</strong> <a href="${href}" style="color:#c1121f;text-decoration:underline;">${link.title}</a></p>`;
      result.push(relatedBox);
      linkIndex++;
    }
  }

  return result.join("");
}

async function getArticleData(siteSlug: string, articleSlug: string, domain: string) {
  try {
    const { rows: siteRows } = await pool.query("SELECT id FROM sites WHERE slug = $1", [siteSlug]);
    if (siteRows.length === 0) return { article: null, related: [] };
    const siteId = siteRows[0].id;

    const { rows: articleRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND slug = $2 LIMIT 1",
      [siteId, articleSlug]
    );

    if (articleRows.length === 0) return { article: null, related: [] };
    const article = articleRows[0];

    // Get related articles from same category (for sidebar)
    const { rows: relatedRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND category = $2 AND id != $3 ORDER BY published_at DESC LIMIT 5",
      [siteId, article.category, article.id]
    );

    // Get articles for internal linking (mix of same category + other categories)
    const { rows: linkRows } = await pool.query(
      `(SELECT title, slug, category FROM articles WHERE site_id = $1 AND category = $2 AND id != $3 ORDER BY published_at DESC LIMIT 3)
       UNION ALL
       (SELECT title, slug, category FROM articles WHERE site_id = $1 AND category != $2 ORDER BY published_at DESC LIMIT 3)`,
      [siteId, article.category, article.id]
    );

    // Inject internal links into article content
    const enrichedContent = injectInternalLinks(
      (article.content as string) || "",
      linkRows as { title: string; slug: string; category: string }[],
      domain
    );

    const format = (row: Record<string, unknown>, useEnrichedContent = false) => ({
      title: row.title as string,
      slug: row.slug as string,
      content: useEnrichedContent ? enrichedContent : ((row.content as string) || ""),
      summary: (row.summary as string) || "",
      category: (row.category as string) || "news",
      author: (row.author as string) || "Staff Reporter",
      featured_image: (row.featured_image as string) || "",
      published_at: row.published_at ? String(row.published_at) : "",
    });

    const formatRelated = (row: Record<string, unknown>) => ({
      img: (row.featured_image as string) || "",
      title: row.title as string,
      summary: (row.summary as string) || "",
      category: (row.category as string) || "News",
      date: row.published_at
        ? new Date(row.published_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "",
      author: (row.author as string) || "Staff Reporter",
      slug: row.slug as string,
    });

    return { article: format(article, true), related: relatedRows.map(formatRelated) };
  } catch {
    return { article: null, related: [] };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { category: string; slug: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const { article } = await getArticleData(site.slug, params.slug, site.domain);

  const categoryLabel = params.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const title = article?.title || `${categoryLabel} - ${params.slug.replace(/-/g, " ")}`;
  const description = article?.summary || `Read ${title} on ${site.name} — Breaking news from ${site.city}, ${site.state}.`;
  const image = article?.featured_image || "";
  const url = `https://${site.domain}/${params.category}/${params.slug}`;

  return {
    title,
    description,
    keywords: [title, categoryLabel, site.city, site.state, site.name, "breaking news"],
    authors: [{ name: article?.author || "Staff Reporter" }],
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: site.name,
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
      publishedTime: article?.published_at || undefined,
      section: categoryLabel,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const site = getSiteFromHeaders();
  const { article, related } = await getArticleData(site.slug, params.slug, site.domain);

  // Real 404 for missing articles — never serve a 200 "thin content" shell
  // with fabricated NewsArticle structured data (AdSense/indexing killer).
  if (!article) {
    notFound();
  }

  // One canonical URL per article: if the URL's category segment doesn't
  // match the article's real category, 301 to the canonical path (otherwise
  // every article is reachable at unlimited duplicate URLs).
  const realCategory = (article.category || "news").toLowerCase().replace(/\s+/g, "-");
  if (realCategory !== params.category) {
    redirect(`/${realCategory}/${params.slug}`);
  }

  const categoryLabel = params.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const displayTitle = article?.title || `${categoryLabel} — ${params.slug.replace(/-/g, " ")}`;
  const description = article?.summary || `Read ${displayTitle} on ${site.name}`;
  const image = article?.featured_image || "";
  const url = `https://${site.domain}/${params.category}/${params.slug}`;

  // Parse author name and title
  const authorParts = (article?.author || "Staff Reporter").split(",");
  const authorName = authorParts[0]?.trim() || "Staff Reporter";
  const authorTitle = authorParts[1]?.trim() || "Staff Reporter";
  const authorSlug = authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // JSON-LD: NewsArticle (Google News optimized)
  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: displayTitle,
    description,
    image: image ? [image] : [],
    datePublished: article?.published_at || "",
    dateModified: article?.published_at || "",
    author: {
      "@type": "Person",
      name: authorName,
      jobTitle: authorTitle,
      url: `https://${site.domain}/author/${authorSlug}`,
      worksFor: {
        "@type": "NewsMediaOrganization",
        name: site.name,
      },
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: `https://${site.domain}/api/favicon?site=${site.slug}`,
        width: 600,
        height: 60,
      },
      parentOrganization: {
        "@type": "Organization",
        name: "MediaChief",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isAccessibleForFree: true,
    articleSection: categoryLabel,
    inLanguage: "en-US",
    copyrightHolder: {
      "@type": "Organization",
      name: site.name,
    },
    copyrightYear: new Date(article?.published_at || "").getFullYear() || new Date().getFullYear(),
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${site.domain}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: `https://${site.domain}/${params.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: displayTitle,
        item: url,
      },
    ],
  };

  const ampUrl = `https://${site.domain}/${params.category}/${params.slug}/amp`;

  return (
    <>
      <link rel="amphtml" href={ampUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ArticlePageClient
        site={site}
        article={article}
        related={related}
        categorySlug={params.category}
        slug={params.slug}
      />
    </>
  );
}
