import { cache } from "react";
import { sites } from "@/config/sites";
import ArticleReactions from "@/components/design/ArticleReactions";
import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { designState } from "@/lib/design-nou";
import { getCityForecast, countiesOf } from "@/lib/local-data";
import { getHomepageArticles } from "@/lib/homepage-data";
import ArticleLive from "@/components/design/live/ArticleLive";
import ArticlePeach from "@/components/design/peach/ArticlePeach";
import ArticleTabloid from "@/components/design/tabloid/ArticleTabloid";
import ArticleMagazine from "@/components/design/magazine/ArticleMagazine";
import ArticleBroadsheet from "@/components/design/broadsheet/ArticleBroadsheet";
import ArticleCoastal from "@/components/design/coastal/ArticleCoastal";
import ArticleDark from "@/components/design/dark/ArticleDark";
import ArticleWestern from "@/components/design/western/ArticleWestern";
import ArticleGazette from "@/components/design/gazette/ArticleGazette";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import pool from "@/lib/db";
import ArticleTools from "@/components/design/ArticleTools";
import { PLACES } from "@/lib/pipeline/relevance";
import { getSiteId } from "@/lib/site-id";
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
      const relatedBox = `<p style="margin:16px 0;padding:12px 16px;background:#f8f8f8;border-left:3px solid var(--accent);font-size:0.95em;"><strong>Related:</strong> <a href="${href}" style="color:var(--accent);text-decoration:underline;">${link.title}</a></p>`;
      result.push(relatedBox);
      linkIndex++;
    }
  }

  return result.join("");
}

// React cache() dedupes within a single request: generateMetadata and the
// page component both call this, which previously ran all four queries twice.
/** The first town or county of the state named in a headline, longest names first. */
function placeIn(title: string, state: string): string | null {
  const t = title.toLowerCase();
  const names = (PLACES[state] || [])
    .concat(countiesOf(state).map((c) => `${c} County`.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  for (const n of names) {
    if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t) && samePlace(title, n)) return n;
  }
  return null;
}

/**
 * Whether a headline names the place itself rather than something called after
 * it: "Houston County" is not Houston, nor are "Sam Houston Elementary" or
 * "Houston Christian" (a school), "Lubbock Christian" or "Austin Peay".
 */
function samePlace(title: string, place: string): boolean {
  const esc = place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\b[A-Za-z]+\\s+)?\\b${esc}\\b(\\s+[A-Za-z]+)?`, "gi");
  const isCounty = /\b(county|parish)$/i.test(place);
  for (const m of Array.from(title.matchAll(re))) {
    const before = (m[1] || "").trim().toLowerCase();
    const after = (m[2] || "").trim().toLowerCase();
    if (!isCounty && /^(county|parish|christian|baptist|university|college|elementary|middle|high|isd|community|state|tech)$/.test(after)) continue;
    if (/^(sam|lake|fort|port|mount|new|little|el|la)$/.test(before)) continue;
    return true;
  }
  return false;
}

/**
 * Reading extras built only from the story itself: an "At a glance" line
 * (place, section, date) and a pull quote copied word for word from a quote in
 * the text, placed after the third paragraph.
 */
function readingExtras(html: string, article: Record<string, unknown>, place: string | null): string {
  const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const when = article.published_at ? new Date(String(article.published_at)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const section = String(article.category || "").replace(/-/g, " ");
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  const bits = [`<b>Read</b>${minutes} min`, place ? `<b>Where</b>${esc(place.replace(/\b\w/g, (c) => c.toUpperCase()))}` : "", section ? `<b>Section</b>${esc(section)}` : "", when ? `<b>Published</b>${esc(when)}` : ""].filter(Boolean);
  const glance = bits.length >= 3 ? `<div class="at-a-glance">${bits.join(" &nbsp;·&nbsp; ")}</div>` : "";
  const text = html.replace(/<[^>]+>/g, " ");
  const q = text.match(/[“"]([^”"]{70,220})[”"]/);
  let out = html;
  if (q) {
    const paras = out.split("</p>");
    if (paras.length > 5) {
      paras[2] += `</p><blockquote class="pull-quote">“${esc(q[1].trim())}”</blockquote`;
      out = paras.join("</p>").replace("</blockquote</p>", "</blockquote>");
    }
  }
  // a table of contents when the story has three or more subheads
  const heads: string[] = [];
  out = out.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const id = `s-${heads.length + 1}`;
    heads.push(inner.replace(/<[^>]+>/g, "").trim());
    return /\bid=/.test(attrs) ? m : `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });
  const toc = heads.length >= 3 ? `<nav class="toc" aria-label="In this story"><b>In this story</b><ol>${heads.map((h, i) => `<li><a href="#s-${i + 1}">${esc(h)}</a></li>`).join("")}</ol></nav>` : "";
  // "By the numbers": up to three sentences from the story that carry its figures, word for word
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z“"])/);
  const figures = sentences
    .filter((x) => /(\$\s?\d|\d+(\.\d+)?\s?(%|percent|million|billion|acres|miles|people|students|homes|jobs|cases|votes))/i.test(x) && x.length >= 50 && x.length <= 240)
    .slice(0, 3);
  const numbers = figures.length >= 2 && words > 350 ? `<aside class="by-numbers"><b>By the numbers</b><ul>${figures.map((f) => `<li>${esc(f.trim())}</li>`).join("")}</ul></aside>` : "";
  if (numbers) {
    const parts = out.split("</p>");
    if (parts.length > 4) { parts[3] += `</p>${numbers}<p hidden`; out = parts.join("</p>").replace("<p hidden</p>", ""); }
  }
  return glance + toc + out;
}

function isoDate(v: unknown): string {
  const d = v ? new Date(v as string) : null;
  return d && !isNaN(d.getTime()) ? d.toISOString() : "";
}

const getArticleData = cache(async (siteSlug: string, articleSlug: string, domain: string) => {
  try {
    const siteId = await getSiteId(siteSlug);
    if (siteId === null) return { article: null, related: [] };

    const { rows: articleRows } = await pool.query(
      "SELECT * FROM articles WHERE site_id = $1 AND slug = $2 LIMIT 1",
      [siteId, articleSlug]
    );

    if (articleRows.length === 0) return { article: null, related: [] };
    const article = articleRows[0];

    // Related articles for the sidebar — list columns only. SELECT * pulled
    // five full article bodies (~50KB of unused HTML) on every article view.
    // Related: first other stories from the same town or county as this one
    // (any date, so the archive keeps receiving links), then the same section
    // around this story's date, then the newest in the section.
    const cols = "title, slug, summary, featured_image, category, author, published_at";
    const state = getSiteByDomain(domain)?.state || "";
    const place = placeIn(article.title, state);
    const { rows: relatedRows } = await pool.query(
      `(SELECT ${cols}, 0 AS rk FROM articles
         WHERE site_id = $1 AND id != $3 AND $4::text IS NOT NULL AND title ILIKE '%' || $4 || '%'
         ORDER BY published_at DESC LIMIT 12)
       UNION ALL
       (SELECT ${cols}, 1 AS rk FROM articles
         WHERE site_id = $1 AND category = $2 AND id != $3 AND published_at < $5
         ORDER BY published_at DESC LIMIT 3)
       UNION ALL
       (SELECT ${cols}, 2 AS rk FROM articles
         WHERE site_id = $1 AND category = $2 AND id != $3
         ORDER BY published_at DESC LIMIT 5)`,
      [siteId, article.category, article.id, place, article.published_at || new Date()]
    );
    const seenRel = new Set<string>();
    relatedRows.splice(0, relatedRows.length, ...relatedRows
      .sort((a: { rk: number }, b: { rk: number }) => a.rk - b.rk)
      .filter((r: { slug: string }) => (seenRel.has(r.slug) ? false : (seenRel.add(r.slug), true)))
      .slice(0, 5));

    // Get articles for internal linking (mix of same category + other categories)
    const { rows: linkRows } = await pool.query(
      `(SELECT title, slug, category FROM articles WHERE site_id = $1 AND category = $2 AND id != $3 ORDER BY published_at DESC LIMIT 3)
       UNION ALL
       (SELECT title, slug, category FROM articles WHERE site_id = $1 AND category != $2 ORDER BY published_at DESC LIMIT 3)`,
      [siteId, article.category, article.id]
    );

    // Inject internal links into article content
    // Paid placements are left alone. A "Related:" box about high-school
    // cross country dropped into the middle of an article somebody bought is
    // the newsroom talking over the advertiser, and it is the first thing the
    // advertiser sees when they open the page they paid for.
    const isSponsored = String(article.author || "").toLowerCase() === "sponsored content";
    const enrichedContent = isSponsored
      ? ((article.content as string) || "")
      : injectInternalLinks(
          (article.content as string) || "",
          linkRows as { title: string; slug: string; category: string }[],
          domain
        );

    // the photo credit a free licence (CC BY, BY-SA) requires
    const creditLine = article.image_credit
      ? `\n<p class="photo-credit"><em>${String(article.image_credit).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</em></p>`
      : "";
    // "More from {place}": the other stories from the town or county this one
    // names, linked inside the story itself, so the archive stays connected.
    const placeLinks = (relatedRows as { rk: number; title: string; slug: string; category: string }[])
      .filter((r) => r.rk === 0 && place && samePlace(r.title, place))
      .slice(0, 4);
    const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const placeLabel = place ? place.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    const placeBox = !isSponsored && place && placeLinks.length >= 2
      ? `\n<section class="more-from"><h2>More from <a href="/${/ (county|parish)$/i.test(place) ? "county" : "city"}/${esc(place.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">${esc(placeLabel)}</a></h2><ul>${placeLinks
          .map((r) => `<li><a href="/${esc((r.category || "local-news").toLowerCase().replace(/\s+/g, "-"))}/${esc(r.slug)}">${esc(r.title)}</a></li>`)
          .join("")}</ul></section>`
      : "";

    // business stories: an offer to companies with news of their own (press release, $49)
    const prState = sites[siteSlug]?.state || "";
    const prBox = !isSponsored && /business/i.test(String(article.category || ""))
      ? `\n<aside class="pr-offer"><b>Have company news in ${esc(prState)}?</b> Publish your press release on ${esc(sites[siteSlug]?.name || "")}, live within one business day. <a href="/press-release">Publish a press release ›</a></aside>`
      : "";

    const format = (row: Record<string, unknown>, useEnrichedContent = false) => ({
      title: row.title as string,
      slug: row.slug as string,
      content: useEnrichedContent ? readingExtras(enrichedContent, article, place) + placeBox + prBox + creditLine : ((row.content as string) || ""),
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

    return { article: format(article, true), related: relatedRows.map(formatRelated), articleId: Number(article.id) || 0 };
  } catch {
    return { article: null, related: [] };
  }
});

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
  searchParams,
}: {
  params: { category: string; slug: string };
  searchParams: { design?: string | string[] };
}) {
  const site = getSiteFromHeaders();
  const { article, related, articleId } = await getArticleData(site.slug, params.slug, site.domain);

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
    // ISO 8601, as Google News / Top Stories require (published_at can arrive as a Date's toString())
    datePublished: isoDate(article?.published_at),
    dateModified: isoDate(article?.published_at),
    author: {
      // a desk byline ("… Newsroom", "Opinion Desk") is the organisation, not a person
      "@type": /\b(Newsroom|Desk|Staff)\b/.test(authorName) ? "Organization" : "Person",
      name: authorName,
      ...(/\b(Newsroom|Desk|Staff)\b/.test(authorName) ? {} : { jobTitle: authorTitle }),
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

  // Per-site design (see lib/design-nou.ts); the preview carries noindex.
  const design = designState(site.slug, searchParams.design);
  const liveData =
    design.family
      ? await Promise.all([getHomepageArticles(site), getCityForecast(site.state)]).then(([home, forecast]) => ({
          latest: home?.pool || home?.latestPosts || [],
          mostRead: (home?.trending || []).concat(home?.popular || []),
          forecast,
        }))
      : null;

  const ArticleView = { peach: ArticlePeach, tabloid: ArticleTabloid, magazine: ArticleMagazine, broadsheet: ArticleBroadsheet, coastal: ArticleCoastal, dark: ArticleDark, western: ArticleWestern, gazette: ArticleGazette, live: ArticleLive }[design.family || "live"];
  return (
    <>
      <link rel="amphtml" href={ampUrl} />
      {design.preview && <meta name="robots" content="noindex, nofollow" />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {design.family && <ArticleTools />}
      {design.family && <ArticleReactions id={articleId || 0} />}
      {design.family ? (
        <ArticleView
          site={site}
          article={article}
          categorySlug={params.category}
          related={related}
          latest={liveData?.latest || []}
          mostRead={liveData?.mostRead || []}
          forecast={liveData?.forecast || null}
          counties={countiesOf(site.state)}
        />
      ) : (
      <ArticlePageClient
        site={site}
        article={article}
        related={related}
        categorySlug={params.category}
        slug={params.slug}
      />
      )}
    </>
  );
}
