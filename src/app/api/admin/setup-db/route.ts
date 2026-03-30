import { NextResponse } from "next/server";
import pool from "@/lib/db";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  logo_first VARCHAR(100) NOT NULL,
  logo_second VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  state_abbr VARCHAR(5) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  ga_measurement_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  content TEXT,
  summary VARCHAR(1000),
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  author VARCHAR(255) DEFAULT 'Staff Reporter',
  featured_image VARCHAR(1000),
  published_at TIMESTAMP DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_hero BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  wp_original_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  UNIQUE(site_id, slug)
);

CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL DEFAULT 'wordpress',
  articles_imported INTEGER DEFAULT 0,
  articles_skipped INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'running',
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

ALTER TABLE sites ADD COLUMN IF NOT EXISTS ga_measurement_id VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_articles_site_id ON articles(site_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_site_category ON articles(site_id, category);
CREATE INDEX IF NOT EXISTS idx_articles_site_slug ON articles(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_articles_wp_id ON articles(wp_original_id);
CREATE INDEX IF NOT EXISTS idx_categories_site_id ON categories(site_id);

-- Pipeline tables
CREATE TABLE IF NOT EXISTS feed_items (
  id SERIAL PRIMARY KEY,
  guid VARCHAR(500) UNIQUE NOT NULL,
  source_feed VARCHAR(255) NOT NULL,
  source_url VARCHAR(2000) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  fetched_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feed_items_status ON feed_items(status);
CREATE INDEX IF NOT EXISTS idx_feed_items_guid ON feed_items(guid);
CREATE INDEX IF NOT EXISTS idx_feed_items_category_state ON feed_items(category, state);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id SERIAL PRIMARY KEY,
  stage VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO pipeline_config (key, value) VALUES
  ('enabled', 'true'),
  ('llm_provider', 'rotation'),
  ('llm_model_gemini', 'gemini-2.0-flash'),
  ('llm_model_openai', 'gpt-4o-mini'),
  ('llm_model_anthropic', 'claude-haiku-4-5-20241022'),
  ('articles_per_batch', '10'),
  ('image_provider', 'pixabay'),
  ('opinion_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Page views analytics
CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  title VARCHAR(300),
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  ip_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_views_site_id ON page_views(site_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_site_created ON page_views(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

-- Extend articles table for pipeline
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_feed_item_id INTEGER;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url VARCHAR(2000);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
`;

export async function GET() {
  try {
    await pool.query(SCHEMA);
    return NextResponse.json({ success: true, message: "Database tables created successfully!" });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
