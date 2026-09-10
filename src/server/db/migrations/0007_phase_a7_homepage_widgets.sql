-- A.7 Homepage Widget CMS Migration
-- 1. Add 'browse_currency' to homepage_section_type_enum
-- 2. Add is_active and display_order to manufacturers

-- Add browse_currency to enum (PostgreSQL requires recreating the enum)
ALTER TYPE homepage_section_type_enum ADD VALUE IF NOT EXISTS 'browse_currency' AFTER 'browse_continent';

-- Add is_active and display_order to manufacturers
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
