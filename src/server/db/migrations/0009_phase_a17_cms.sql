-- Phase A.17: CMS, Homepage & Content Management

-- 1. Create blog post status enum
CREATE TYPE blog_post_status_enum AS ENUM ('draft', 'published', 'archived');

-- 2. Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  mobile_image_url TEXT,
  button_text VARCHAR(100),
  button_link TEXT,
  placement VARCHAR(50) NOT NULL DEFAULT 'homepage',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX banners_placement_idx ON banners(placement);
CREATE INDEX banners_is_active_idx ON banners(is_active);
CREATE INDEX banners_display_order_idx ON banners(display_order);
CREATE INDEX banners_start_date_idx ON banners(start_date);
CREATE INDEX banners_end_date_idx ON banners(end_date);

-- 3. Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_location VARCHAR(255),
  customer_image_url TEXT,
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  video_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX testimonials_is_published_idx ON testimonials(is_published);
CREATE INDEX testimonials_display_order_idx ON testimonials(display_order);

-- 4. Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX faqs_category_idx ON faqs(category);
CREATE INDEX faqs_is_published_idx ON faqs(is_published);
CREATE INDEX faqs_display_order_idx ON faqs(display_order);

-- 5. Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  author VARCHAR(255),
  category VARCHAR(100),
  tags TEXT,
  status blog_post_status_enum NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  seo_title VARCHAR(255),
  seo_description TEXT,
  canonical_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX blog_posts_status_idx ON blog_posts(status);
CREATE INDEX blog_posts_category_idx ON blog_posts(category);
CREATE INDEX blog_posts_published_at_idx ON blog_posts(published_at);

-- 6. Create media uploads table
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(255),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX media_uploads_mime_type_idx ON media_uploads(mime_type);
CREATE INDEX media_uploads_uploaded_by_idx ON media_uploads(uploaded_by);

-- 7. Add how_it_works to homepage_section_type_enum (if not already present)
-- The enum already exists, we need to alter it
ALTER TYPE homepage_section_type_enum ADD VALUE IF NOT EXISTS 'how_it_works';
