export interface DbSite {
  id: number;
  slug: string;
  domain: string;
  name: string;
  logo_first: string;
  logo_second: string;
  city: string;
  state: string;
  state_abbr: string;
  tagline: string;
  created_at: string;
}

export interface DbArticle {
  id: number;
  site_id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  author: string;
  featured_image: string;
  published_at: string;
  is_featured: boolean;
  is_trending: boolean;
  is_hero: boolean;
  views: number;
  created_at: string;
}

export interface DbCategory {
  id: number;
  site_id: number;
  name: string;
  slug: string;
}
