-- Railway PostgreSQL Schema for 50-site News Network

-- Sites table
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

-- Articles table
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

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  UNIQUE(site_id, slug)
);

-- Import logs (track WordPress imports)
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_articles_site_id ON articles(site_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_site_category ON articles(site_id, category);
CREATE INDEX IF NOT EXISTS idx_articles_site_featured ON articles(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_site_trending ON articles(site_id, is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_articles_site_hero ON articles(site_id, is_hero) WHERE is_hero = true;
CREATE INDEX IF NOT EXISTS idx_articles_site_slug ON articles(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_articles_wp_id ON articles(wp_original_id);
CREATE INDEX IF NOT EXISTS idx_categories_site_id ON categories(site_id);
