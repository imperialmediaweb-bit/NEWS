-- Migration: Facebook auto-posting support
-- Adds per-site Facebook Page credentials + tracks posted articles

ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_page_id VARCHAR(100);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_page_name VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_access_token TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_posting_enabled BOOLEAN DEFAULT false;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_last_posted_at TIMESTAMP;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS fb_token_expires_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS fb_posts (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  fb_post_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,
  posted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_fb_posts_site ON fb_posts(site_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_posts_article ON fb_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_sites_fb_enabled ON sites(fb_posting_enabled) WHERE fb_posting_enabled = true;
