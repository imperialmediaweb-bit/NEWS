import type { Metadata } from "next";
import { getActiveSite } from "@/config/sites";
import "./globals.css";

const site = getActiveSite();

export const metadata: Metadata = {
  title: `${site.name} | ${site.tagline}`,
  description: `Breaking news, celebrity, sports, politics and more from ${site.name} — ${site.state}'s most-read news source.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Oswald:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
