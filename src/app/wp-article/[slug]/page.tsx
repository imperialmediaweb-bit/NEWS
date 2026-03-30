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

async function getArticleBySlug(siteSlug: string, articleSlug: string) {
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
  params: { slug: string };
}): Promise<Metadata> {
  const site = getSiteFromHeaders();
  const { article } = await getArticleBySlug(site.slug, params.slug);

  const title = article?.title || params.slug.replace(/-/g, " ");
  const description = article?.summary || `Read ${title} on ${site.name}`;
  const image = article?.featured_image || "";
  const categorySlug = (article?.category || "news").toLowerCase().replace(/\s+/g, "-");
  const url = `https://${site.domain}/${categorySlug}/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: site.name,
      ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
      publishedTime: article?.published_at || undefined,
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

export default async function WpArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const site = getSiteFromHeaders();
  const { article, related } = await getArticleBySlug(site.slug, params.slug);

  const categorySlug = (article?.category || "news").toLowerCase().replace(/\s+/g, "-");
  const categoryLabel = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const displayTitle = article?.title || params.slug.replace(/-/g, " ");
  const description = article?.summary || `Read ${displayTitle} on ${site.name}`;
  const image = article?.featured_image || "";
  const url = `https://${site.domain}/${categorySlug}/${params.slug}`;

  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: displayTitle,
    description,
    image: image ? [image] : [],
    datePublished: article?.published_at || "",
    dateModified: article?.published_at || "",
    author: { "@type": "Person", name: article?.author || "Staff Reporter" },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `https://${site.domain}/api/favicon?site=${site.slug}` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://${site.domain}` },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: `https://${site.domain}/${categorySlug}` },
      { "@type": "ListItem", position: 3, name: displayTitle, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ArticlePageClient
        site={site}
        article={article}
        related={related}
        categorySlug={categorySlug}
        slug={params.slug}
      />
    </>
  );
}
