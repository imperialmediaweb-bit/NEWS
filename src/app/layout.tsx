import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE DAILY HERALD | Britain's Boldest Newspaper",
  description: "Breaking news, showbiz, sport, politics and more from Britain's most-read tabloid newspaper.",
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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Oswald:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
