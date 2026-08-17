-- Phase A.4: CMS — pages, homepage sections, menus, page versions

-- 1. Create enums
CREATE TYPE cms_page_status_enum AS ENUM ('draft', 'published', 'archived');

CREATE TYPE homepage_section_type_enum AS ENUM (
  'hero', 'search', 'featured_vehicles', 'latest_vehicles',
  'browse_make', 'browse_body_type', 'browse_country', 'browse_continent',
  'why_choose_us', 'statistics', 'testimonials', 'faq', 'cta', 'footer'
);

CREATE TYPE menu_location_enum AS ENUM ('header', 'footer', 'mobile');

-- 2. cms_pages
CREATE TABLE cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status cms_page_status_enum NOT NULL DEFAULT 'draft',
  featured_image_url TEXT,
  seo_title VARCHAR(255),
  meta_description VARCHAR(500),
  canonical_url VARCHAR(500),
  og_image TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT true,
  robots_follow BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX cms_pages_slug_idx ON cms_pages(slug);
CREATE INDEX cms_pages_status_idx ON cms_pages(status);

-- 3. cms_page_versions
CREATE TABLE cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  content TEXT,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  seo_title VARCHAR(255),
  meta_description VARCHAR(500),
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX cms_page_versions_page_id_idx ON cms_page_versions(page_id);

-- 4. homepage_sections
CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type homepage_section_type_enum NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(255),
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  image_alt VARCHAR(255),
  button_label VARCHAR(100),
  button_url VARCHAR(500),
  button2_label VARCHAR(100),
  button2_url VARCHAR(500),
  extra_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX homepage_sections_type_idx ON homepage_sections(type);
CREATE INDEX homepage_sections_display_order_idx ON homepage_sections(display_order);
CREATE INDEX homepage_sections_is_enabled_idx ON homepage_sections(is_enabled);

-- 5. menus
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location menu_location_enum NOT NULL,
  label VARCHAR(100) NOT NULL,
  url VARCHAR(500),
  page_slug VARCHAR(255),
  external_url VARCHAR(500),
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX menus_location_idx ON menus(location);
CREATE INDEX menus_parent_id_idx ON menus(parent_id);
CREATE INDEX menus_display_order_idx ON menus(display_order);
