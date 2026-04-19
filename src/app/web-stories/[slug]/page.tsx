"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSiteDetection } from "@/hooks/useSiteDetection";
import { getActiveSite } from "@/config/sites";
import { SiteConfig } from "@/config/site-config";

interface StoryData {
  id: number;
  title: string;
  summary: string;
  featured_image: string;
  category: string;
  slug: string;
  published_at: string;
  author: string;
}

const SLIDE_COUNT = 3;
const AUTO_ADVANCE_MS = 5000;

export default function WebStoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const detectedSite = useSiteDetection();
  const [site, setSite] = useState<SiteConfig>(getActiveSite());
  const [story, setStory] = useState<StoryData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (detectedSite) {
      setSite(detectedSite);
    }
  }, [detectedSite]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stories?site=${site.slug}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.stories || []).find(
          (s: StoryData) => s.slug === slug
        );
        setStory(found || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [site, slug]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= SLIDE_COUNT) return;
      setCurrentSlide(index);
      if (containerRef.current) {
        const slideWidth = containerRef.current.offsetWidth;
        containerRef.current.scrollTo({
          left: slideWidth * index,
          behavior: "smooth",
        });
      }
    },
    []
  );

  // Auto-advance timer
  useEffect(() => {
    if (!story) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = prev < SLIDE_COUNT - 1 ? prev + 1 : 0;
        if (containerRef.current) {
          const slideWidth = containerRef.current.offsetWidth;
          containerRef.current.scrollTo({
            left: slideWidth * next,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [story]);

  // Inject structured data and meta tags for Google Discover + SEO
  useEffect(() => {
    if (!story) return;

    document.title = `${story.title} | ${site.name}`;

    const elements: HTMLElement[] = [];

    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      const meta = document.createElement("meta");
      meta.setAttribute(attr, key);
      meta.content = content;
      document.head.appendChild(meta);
      elements.push(meta);
    };

    // Google Discover — requires large image preview
    setMeta("name", "robots", "max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta("name", "description", story.summary || story.title);

    // Open Graph for Discover + social
    setMeta("property", "og:type", "article");
    setMeta("property", "og:title", story.title);
    setMeta("property", "og:description", story.summary || story.title);
    setMeta("property", "og:image", story.featured_image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "1200");
    setMeta("property", "og:url", `https://${site.domain}/web-stories/${story.slug}`);
    setMeta("property", "og:site_name", site.name);
    setMeta("property", "article:published_time", story.published_at);
    setMeta("property", "article:author", story.author);
    setMeta("property", "article:section", story.category);

    // Twitter card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", story.title);
    setMeta("name", "twitter:description", story.summary || story.title);
    setMeta("name", "twitter:image", story.featured_image);

    // AMP link for Google
    const ampLink = document.createElement("link");
    ampLink.rel = "amphtml";
    ampLink.href = `/web-stories/${story.slug}/amp`;
    document.head.appendChild(ampLink);
    elements.push(ampLink);

    // Canonical
    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = `https://${site.domain}/web-stories/${story.slug}`;
    document.head.appendChild(canonical);
    elements.push(canonical);

    // WebStory structured data
    const schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebStory",
      name: story.title,
      headline: story.title,
      description: story.summary,
      image: story.featured_image,
      datePublished: story.published_at,
      author: {
        "@type": "Person",
        name: story.author,
      },
      publisher: {
        "@type": "Organization",
        name: site.name,
        logo: {
          "@type": "ImageObject",
          url: `https://${site.domain}/logo.png`,
        },
      },
    });
    document.head.appendChild(schemaScript);
    elements.push(schemaScript);

    return () => {
      elements.forEach((el) => {
        if (document.head.contains(el)) document.head.removeChild(el);
      });
    };
  }, [story, site]);

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goToSlide(currentSlide - 1);
    } else {
      goToSlide(currentSlide + 1 < SLIDE_COUNT ? currentSlide + 1 : 0);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Story not found</p>
        <Link href="/web-stories" className="text-blue-400 underline">
          Back to stories
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black" onClick={handleTap}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{
                width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%",
                animation:
                  i === currentSlide
                    ? `progress ${AUTO_ADVANCE_MS}ms linear`
                    : "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <Link
        href="/web-stories"
        className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-black/50 rounded-full text-white text-lg"
        onClick={(e) => e.stopPropagation()}
      >
        &times;
      </Link>

      {/* Slides container */}
      <div
        ref={containerRef}
        className="w-full h-full flex overflow-x-hidden"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Slide 1: Featured image + title */}
        <div
          className="w-full h-full flex-shrink-0 relative"
          style={{ scrollSnapAlign: "start" }}
        >
          <img
            src={story.featured_image}
            alt={story.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
            <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 rounded mb-3">
              {story.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {story.title}
            </h1>
            <p className="text-gray-300 text-sm mt-2">
              {story.author} &middot;{" "}
              {new Date(story.published_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Slide 2: Summary */}
        <div
          className="w-full h-full flex-shrink-0 relative flex items-center justify-center"
          style={{
            scrollSnapAlign: "start",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          <div className="px-8 max-w-lg text-center">
            <div className="w-12 h-1 bg-red-500 mx-auto mb-6" />
            <p className="text-xl sm:text-2xl text-white leading-relaxed font-light">
              {story.summary || "Read the full article for more details."}
            </p>
            <div className="w-12 h-1 bg-red-500 mx-auto mt-6" />
          </div>
        </div>

        {/* Slide 3: CTA */}
        <div
          className="w-full h-full flex-shrink-0 relative flex flex-col items-center justify-center"
          style={{
            scrollSnapAlign: "start",
            background: "linear-gradient(135deg, #0f3460 0%, #533483 50%, #e94560 100%)",
          }}
        >
          <div className="text-center px-8">
            <h2 className="text-3xl font-black text-white mb-4">
              Want the full story?
            </h2>
            <p className="text-gray-200 mb-8 text-lg">
              Read the complete article on {site.name}
            </p>
            <Link
              href={`/${story.category}/${story.slug}`}
              className="inline-block bg-white text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-gray-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Read Full Article
            </Link>
            <div className="mt-8">
              <Link
                href="/web-stories"
                className="text-white/70 underline text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Browse more stories
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar animation keyframes */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
