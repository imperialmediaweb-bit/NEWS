import { MetadataRoute } from "next";
import { getActiveSite } from "@/config/sites";

export default function robots(): MetadataRoute.Robots {
  const site = getActiveSite();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `https://${site.domain}/sitemap.xml`,
  };
}
