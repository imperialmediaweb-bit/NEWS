import { Metadata } from "next";
import { headers } from "next/headers";
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

async function getArticleData(siteSlug: string, articleSlug: string) {
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

    const { rows: relatedRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND category = $2 AND id != $3 ORDER BY published_at DESC LIMIT 5",
      [siteId, article.category, article.id]
    );

    const format = (row: Record<string, unknown>) => ({
      title: row.title as string,
      slug: row.slug as string,
      content: (row.content as string) || "",
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

    return { article: format(article), related: relatedRows.map(formatRelated) };
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
  const { article } = await getArticleData(site.slug, params.slug);

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
  const { article, related } = await getArticleData(site.slug, params.slug);

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

  return (
    <>
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
