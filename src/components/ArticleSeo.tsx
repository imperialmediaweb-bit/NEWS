"use client";

import { useEffect } from "react";
import { SiteConfig } from "@/config/site-config";

interface ArticleSeoProps {
  title: string;
  description: string;
  image: string;
  author: string;
  publishedAt: string;
  category: string;
  slug: string;
  site: SiteConfig;
}

export default function ArticleSeo({
  title,
  description,
  image,
  author,
  publishedAt,
  category,
  slug,
  site,
}: ArticleSeoProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | ${site.name}`;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `https://${site.domain}/${category}/${slug}`;
    const desc = description || `Read ${title} on ${site.name}`;

    // Standard meta
    setMeta("name", "description", desc);
    setMeta("name", "author", author);
    setMeta("name", "keywords", `${title}, ${category}, ${site.city}, ${site.state}, ${site.name}`);

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:site_name", site.name);
    setMeta("property", "article:published_time", publishedAt);
    setMeta("property", "article:author", author);
    setMeta("property", "article:section", category);

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD Structured Data
    const existingLd = document.querySelector("script[data-article-ld]");
    if (existingLd) existingLd.remove();

    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.setAttribute("data-article-ld", "true");
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description: desc,
      image: image ? [image] : [],
      datePublished: publishedAt,
      dateModified: publishedAt,
      author: {
        "@type": "Person",
        name: author,
      },
      publisher: {
        "@type": "Organization",
        name: site.name,
        logo: {
          "@type": "ImageObject",
          url: `https://${site.domain}/favicon.ico`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    });
    document.head.appendChild(ldScript);

    return () => {
      const ld = document.querySelector("script[data-article-ld]");
      if (ld) ld.remove();
    };
  }, [title, description, image, author, publishedAt, category, slug, site]);

  return null;
}
