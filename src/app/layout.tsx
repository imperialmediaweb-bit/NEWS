import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { STATE_FACTS } from "@/config/state-data";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import FacebookPixel from "@/components/FacebookPixel";
import PushNotification from "@/components/PushNotification";

// Google AdSense publisher ID — shared across the whole network
const ADSENSE_CLIENT = "ca-pub-3341252465268510";

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

/** A homepage description that says what the site is, in about 155 characters. */
function siteDescription(site: { name: string; state: string; city: string }) {
  const cities = (STATE_FACTS[site.state]?.cities || []).slice(0, 3).map((c) => c[0]).join(", ") || site.city;
  const d = `${site.state} news today from ${site.name}: local news, politics, business, sports and weather from ${cities} and every county.`;
  return d.length > 160 ? d.slice(0, 157).replace(/\s+\S*$/, "") + "…" : d;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteFromHeaders();

  return {
    title: {
      default: `${site.name}: ${site.state} News, Weather & Local Stories`,
      template: `%s | ${site.name}`,
    },
    description: siteDescription(site),
    keywords: [
      site.name,
      site.city,
      site.state,
      "breaking news",
      "local news",
      "politics",
      "sports",
      "crime",
      "weather",
      `${site.city} news`,
      `${site.state} news`,
    ],
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: site.name,
      title: `${site.name}: ${site.state} News, Weather & Local Stories`,
      description: siteDescription(site),
      images: [{ url: `https://${site.domain}/api/og`, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name}: ${site.state} News, Weather & Local Stories`,
      description: siteDescription(site),
      images: [`https://${site.domain}/api/og`],
    },
    alternates: {
      canonical: `https://${site.domain}`,
    },
    icons: {
      icon: `/api/favicon?site=${site.slug}`,
    },
    other: {
      "google-site-verification": "aV0XJE-iAF9jk2o4XvPTcJyQjSvyuH8ZcPV0zi-G2I8",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = getSiteFromHeaders();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: site.name,
    url: `https://${site.domain}`,
    logo: {
      "@type": "ImageObject",
      url: `https://${site.domain}/api/favicon?site=${site.slug}`,
    },
    sameAs: [],
    parentOrganization: {
      "@type": "Organization",
      name: "MediaChief",
      description: "A network of 50 state news publications covering local news across the United States.",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: site.city,
      addressRegion: site.state,
      addressCountry: "US",
    },
    description: `${site.name} — Breaking news, local news, politics, sports, entertainment and more from ${site.city}, ${site.state}. A MediaChief publication.`,
  };

  return (
    <html
      lang="en"
      style={{
        // Per-site theme: each of the 50 states has its own identity colour,
        // so the network does not render as 50 identical clones.
        ["--accent" as string]: site.accent,
        ["--accent-dark" as string]: site.accentDark,
      } as React.CSSProperties}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" href="/manifest.json" />
        {/* the lead photos come from the free libraries: open those connections first */}
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://pixabay.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet" />
        {/* Google AdSense — one publisher ID across all 50 sites. Off for now
            (user, 22.11.2026: "deocamdată fără AdSense", for speed); set
            ADSENSE_ON=1 in Railway to bring it back without a code change. */}
        {process.env.ADSENSE_ON === "1" && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: `https://${site.domain}`, inLanguage: "en-US", publisher: { "@type": "NewsMediaOrganization", name: site.name }, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `https://${site.domain}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" } }) }}
        />
      </head>
      <body className="antialiased bg-white overflow-x-hidden">
        {children}
        <GoogleAnalytics />
        {/* Meta pixel — only renders when FACEBOOK_PIXEL_ID is set, and only
            fires once the visitor has accepted cookies. */}
        <FacebookPixel
          pixelId={process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
        />
        <AnalyticsTracker />
        <CookieConsent />
        <PushNotification />
      </body>
    </html>
  );
}
