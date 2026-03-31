import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteByDomain, getActiveSite } from "@/config/sites";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import PushNotification from "@/components/PushNotification";

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

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteFromHeaders();

  return {
    title: {
      default: `${site.name} | ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: `Breaking news, celebrity gossip, sports, politics and more from ${site.name} — ${site.city}, ${site.state}'s most-read news source.`,
    keywords: [
      site.name,
      site.city,
      site.state,
      "breaking news",
      "local news",
      "politics",
      "sports",
      "entertainment",
      "celebrity",
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
      title: `${site.name} | ${site.tagline}`,
      description: `Breaking news from ${site.city}, ${site.state}. Local news, politics, sports, entertainment and more.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} | ${site.tagline}`,
      description: `Breaking news from ${site.city}, ${site.state}. Local news, politics, sports, entertainment and more.`,
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
      description: "America's largest media trust with 50 state newspapers delivering breaking news coast to coast.",
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased bg-white overflow-x-hidden">
        {children}
        <GoogleAnalytics />
        <AnalyticsTracker />
        <CookieConsent />
        <PushNotification />
      </body>
    </html>
  );
}
