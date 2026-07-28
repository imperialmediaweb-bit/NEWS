import { SiteConfig } from "@/config/site-config";

export interface Article {
  img: string;
  title: string;
  summary?: string;
  category: string;
  date: string;
  author?: string;
  time?: string;
  slug?: string;
}

/**
 * Site boilerplate text (footer blurb etc).
 *
 * NOTE: This module used to generate hardcoded placeholder "news" articles.
 * That content was removed deliberately — fabricated stories attributed to
 * invented reporters violate AdSense misrepresentation policy and Facebook
 * authenticity rules. Pages must render REAL articles from the database or
 * an honest empty state. Never re-add fake article generators here.
 */
export function generateContent(site: SiteConfig): { footerAbout: string } {
  const { name, state } = site;
  return {
    footerAbout: `${name} is ${state}'s premier source for breaking news, politics, sports, entertainment, and local stories. Our dedicated team covers the stories that matter most to ${state} residents, delivering accurate and timely reporting you can trust.`,
  };
}
