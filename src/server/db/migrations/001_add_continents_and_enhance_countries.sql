-- ZafAutos Phase A: Countries, Continents, Currencies — Final Production Schema
-- Run this migration against your Supabase PostgreSQL database.

-- ── Drop old columns from countries if they exist ───────────────────────────
ALTER TABLE "countries" DROP COLUMN IF EXISTS "code";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "iso2";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "iso3";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "phone_code";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "flag_url";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "currency_code";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "currency_symbol";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "sort_order";
ALTER TABLE "countries" DROP COLUMN IF EXISTS "flag_image_url";

-- ── Rename legacy columns ──────────────────────────────────────────────────
-- If an earlier migration created continents with sort_order, rename it
-- instead of dropping/recreating so existing data is preserved.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'continents' AND column_name = 'sort_order'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'continents' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE "continents" RENAME COLUMN "sort_order" TO "display_order";
  END IF;
END $$;

-- ── Extend currencies table ─────────────────────────────────────────────────
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "symbol" varchar(10);
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "decimal_places" integer NOT NULL DEFAULT 2;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "symbol_position" varchar(10) NOT NULL DEFAULT 'before';
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "exchange_rate" numeric(16,6) NOT NULL DEFAULT 1;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "last_updated" timestamp with time zone;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "currencies" ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0;

-- ── Enforce exactly one default currency ────────────────────────────────────
-- Partial unique index: only one row can have is_default = true
CREATE UNIQUE INDEX IF NOT EXISTS "currencies_one_default_idx"
  ON "currencies" ("is_default")
  WHERE "is_default" = true;

-- ── Create continents table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "continents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_by" uuid,
  "deleted_at" timestamp with time zone,
  "deleted_by" uuid
);

CREATE INDEX IF NOT EXISTS "continents_slug_idx" ON "continents" ("slug");

-- ── Add columns to countries table ──────────────────────────────────────────
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "slug" varchar(255);
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "flag_image" text;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "currency_id" uuid REFERENCES "currencies"("id") ON DELETE SET NULL;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "continent_id" uuid REFERENCES "continents"("id") ON DELETE SET NULL;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "countries" ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "countries_continent_id_idx" ON "countries" ("continent_id");
CREATE INDEX IF NOT EXISTS "countries_slug_idx" ON "countries" ("slug");
CREATE INDEX IF NOT EXISTS "countries_currency_id_idx" ON "countries" ("currency_id");

-- ── Ensure unique slug constraint ───────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "countries" ADD CONSTRAINT "countries_slug_unique" UNIQUE ("slug");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Create flags storage bucket ─────────────────────────────────────────────
-- Run in Supabase Dashboard > Storage > New Bucket:
--   Name: flags
--   Public: true
--   File size limit: 1MB
--   Allowed MIME types: image/svg+xml, image/png
