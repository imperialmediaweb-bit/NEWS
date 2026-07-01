/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Gzip-compress all responses at the origin — Railway egress is billed
  // per GB, so compressed HTML/JSON/XML leaves the server 5-10x smaller
  // on its way to Cloudflare. Biggest single egress win.
  compress: true,
  // Drop unnecessary bytes/headers and skip shipping source maps in prod.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  // Immutable long-cache for static assets so Cloudflare/browsers never re-fetch.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
