"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSiteDetection } from "@/hooks/useSiteDetection";
import { getSeoPageConfig } from "@/data/seo-pages";
import { seoPages } from "@/data/seo-pages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SeoArticle {
  img: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  slug: string;
}

export default function SeoTopicPage() {
  const params = useParams();
  const stateSlug = (params.state as string) || "";
  const topicSlug = (params.topic as string) || "";

  const site = useSiteDetection();
  const [articles, setArticles] = useState<SeoArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const config = getSeoPageConfig(stateSlug, topicSlug);

  // Inject SEO meta tags
  useEffect(() => {
    if (!config || !site) return;
    const { page, state } = config;

    document.title = page.title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`
      ) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `https://${state.domain}/seo/${stateSlug}/${topicSlug}`;

    setMeta("name", "description", page.description);
    setMeta("name", "keywords", page.keywords.join(", "));
    setMeta("property", "og:title", page.title);
    setMeta("property", "og:description", page.description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", site.name);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", page.title);
    setMeta("name", "twitter:description", page.description);

    // Canonical
    let canonical = document.querySelector(
      "link[rel='canonical']"
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD
    const existingLd = document.querySelector("script[data-seo-ld]");
    if (existingLd) existingLd.remove();

    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.setAttribute("data-seo-ld", "true");
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.title,
      description: page.description,
      url,
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
      about: {
        "@type": "Place",
        name: `${state.city}, ${state.state}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: state.city,
          addressRegion: state.stateAbbr,
          addressCountry: "US",
        },
      },
    });
    document.head.appendChild(ldScript);

    return () => {
      const ld = document.querySelector("script[data-seo-ld]");
      if (ld) ld.remove();
    };
  }, [config, site, stateSlug, topicSlug]);

  // Fetch articles
  useEffect(() => {
    if (!site || !config) return;
    setLoading(true);
    fetch(`/api/seo-articles?site=${site.slug}&topic=${topicSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) {
          setArticles(data.articles);
        }
      })
      .catch(() => {
        /* silently fail, show empty state */
      })
      .finally(() => setLoading(false));
  }, [site, config, topicSlug]);

  if (!site) return <div className="min-h-screen bg-[#f5f5f5]" />;

  if (!config) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header site={site} />
        <div className="max-w-[1300px] mx-auto px-4 py-20 text-center">
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
          >
            Page Not Found
          </h1>
          <p className="text-gray-500">
            The requested page does not exist.
          </p>
          <Link href="/" className="text-[#c1121f] mt-4 inline-block hover:underline">
            Return to homepage
          </Link>
        </div>
        <Footer site={site} about={`${site.name} — ${site.tagline}`} />
      </div>
    );
  }

  const { page, state: stateConfig } = config;

  const topicLabel = topicSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Get other SEO pages for this state for internal linking
  const currentState = seoPages.find((s) => s.stateSlug === stateSlug);
  const otherPages = currentState
    ? currentState.pages.filter((p) => p.topicSlug !== topicSlug)
    : [];

  const makeArticleHref = (article: SeoArticle) => {
    const cat = article.category
      ? article.category.toLowerCase().replace(/\s+/g, "-")
      : "local-news";
    return `/${cat}/${article.slug}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header site={site} />

      {/* Hero Banner */}
      <div className="bg-black text-white">
        <div className="max-w-[1300px] mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-300">{stateConfig.state}</span>
            <ChevronRight size={14} />
            <span className="text-[#c1121f]">{topicLabel}</span>
          </nav>
          <h1
            className="text-3xl md:text-5xl"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
            }}
          >
            {page.h1}
          </h1>
          <p
            className="text-gray-400 mt-2 text-sm"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {page.description}
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className="px-3 py-1 text-sm font-bold uppercase tracking-wider text-white"
                style={{
                  backgroundColor: "#c1121f",
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                {topicLabel}
              </span>
              <div className="flex-1 h-[2px] bg-gray-200" />
            </div>

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-[160px] h-[110px] bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && articles.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center">
                <h2
                  className="text-xl mb-2"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 900,
                  }}
                >
                  No Articles Found
                </h2>
                <p className="text-gray-500 text-sm">
                  Check back soon for the latest {topicLabel.toLowerCase()}{" "}
                  news from {stateConfig.city}, {stateConfig.state}.
                </p>
              </div>
            )}

            {!loading && articles.length > 0 && (
              <>
                {/* Lead Article */}
                <Link
                  href={makeArticleHref(articles[0])}
                  className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow mb-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7 relative h-[280px] lg:h-[380px] overflow-hidden">
                      <img
                        src={articles[0].img}
                        alt={articles[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <span
                        className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded"
                        style={{
                          backgroundColor: "#c1121f",
                          fontFamily: "'Oswald', sans-serif",
                        }}
                      >
                        {articles[0].category}
                      </span>
                    </div>
                    <div className="lg:col-span-5 p-6 flex flex-col justify-center">
                      <h2
                        className="text-xl lg:text-2xl leading-tight group-hover:text-[#c1121f] transition-colors mb-4"
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontWeight: 900,
                        }}
                      >
                        {articles[0].title}
                      </h2>
                      {articles[0].summary && (
                        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                          {articles[0].summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{articles[0].author}</span>
                        <span>&bull;</span>
                        <span>{articles[0].date}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Grid Articles */}
                {articles.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {articles.slice(1, 7).map((article, i) => (
                      <Link
                        key={i}
                        href={makeArticleHref(article)}
                        className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full"
                      >
                        <div className="relative h-[200px] overflow-hidden">
                          <img
                            src={article.img}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span
                            className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
                            style={{
                              backgroundColor: "#c1121f",
                              fontFamily: "'Oswald', sans-serif",
                            }}
                          >
                            {article.category}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3
                            className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mb-2"
                            style={{
                              fontFamily: "'Source Serif 4', serif",
                              fontWeight: 700,
                            }}
                          >
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{article.author}</span>
                            <span>&bull;</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* List Articles */}
                {articles.length > 7 && (
                  <div className="space-y-4">
                    {articles.slice(7).map((article, i) => (
                      <Link
                        key={i}
                        href={makeArticleHref(article)}
                        className="group flex gap-4 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow p-4"
                      >
                        <div className="relative w-[160px] h-[110px] flex-shrink-0 rounded-lg overflow-hidden">
                          <img
                            src={article.img}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span
                            className="text-[10px] font-bold uppercase text-[#c1121f] tracking-wider mb-1"
                            style={{
                              fontFamily: "'Oswald', sans-serif",
                            }}
                          >
                            {article.category}
                          </span>
                          <h3
                            className="text-sm font-bold leading-snug group-hover:text-[#c1121f] transition-colors line-clamp-2 mb-1"
                            style={{
                              fontFamily: "'Source Serif 4', serif",
                              fontWeight: 700,
                            }}
                          >
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{article.author}</span>
                            <span>&bull;</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar: Internal Links to Other SEO Pages */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[140px] space-y-6">
              {/* Related Topics for this State */}
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3
                  className="text-lg mb-4 pb-3 border-b-2 border-[#c1121f]"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 900,
                  }}
                >
                  More {stateConfig.city} Coverage
                </h3>
                <ul className="space-y-2">
                  {otherPages.map((p) => {
                    const label = p.topicSlug
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <li key={p.topicSlug}>
                        <Link
                          href={`/seo/${stateSlug}/${p.topicSlug}`}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm hover:bg-[#f5f5f5] hover:text-[#c1121f] transition-colors"
                          style={{
                            fontFamily: "'Source Serif 4', serif",
                            fontWeight: 600,
                          }}
                        >
                          <ChevronRight
                            size={14}
                            className="text-[#c1121f] flex-shrink-0"
                          />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* About box */}
              <div className="bg-black text-white rounded-xl p-5">
                <h3
                  className="text-lg mb-3"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 900,
                  }}
                >
                  About {site.name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {site.name} is your trusted source for{" "}
                  {topicLabel.toLowerCase()} news and updates from{" "}
                  {stateConfig.city}, {stateConfig.state}. Stay informed
                  with the latest local coverage.
                </p>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-[#c1121f] text-white text-sm font-bold rounded hover:bg-[#9b111e] transition-colors"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Visit Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer
        site={site}
        about={`${site.name} — ${site.tagline}. Your source for ${topicLabel.toLowerCase()} and more from ${stateConfig.city}, ${stateConfig.state}.`}
      />
    </div>
  );
}
