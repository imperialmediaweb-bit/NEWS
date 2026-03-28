import type { Metadata } from "next";
import { getActiveSite } from "@/config/sites";
import "./globals.css";
import Script from "next/script";

const site = getActiveSite();

export const metadata: Metadata = {
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
  other: {
    "google-site-verification": "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = site.gaMeasurementId;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Serif+Display&family=Oswald:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white">
        {children}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
