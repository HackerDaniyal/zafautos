-- Phase A.2: Settings modules (Tax, Email, Notifications)

-- 1. Create tax_type_enum
CREATE TYPE tax_type_enum AS ENUM ('percentage', 'fixed');

-- 2. Create tax_rates table
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  rate NUMERIC(5,2) NOT NULL,
  type tax_type_enum NOT NULL DEFAULT 'percentage',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX tax_rates_country_idx ON tax_rates(country_id);
CREATE INDEX tax_rates_is_default_idx ON tax_rates(is_default);

-- 3. Extend email_templates with key, description, is_active
-- Add key column as nullable first, backfill, then constrain
ALTER TABLE email_templates ADD COLUMN key VARCHAR(100);
ALTER TABLE email_templates ADD COLUMN description TEXT;
ALTER TABLE email_templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing rows with a generated key from name
UPDATE email_templates
SET key = LOWER(REPLACE(REPLACE(TRIM(name), ' ', '_'), '.', '_'))
WHERE key IS NULL AND name IS NOT NULL;

-- For any remaining null keys, use id as fallback
UPDATE email_templates
SET key = 'template_' || REPLACE(id::text, '-', '')
WHERE key IS NULL;

-- Now make key NOT NULL and add constraints
ALTER TABLE email_templates ALTER COLUMN key SET NOT NULL;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_key_unique UNIQUE (key);
ALTER TABLE email_templates ADD CONSTRAINT email_templates_key_not_empty CHECK (key <> '');

-- 4. Extend email_logs with template_id, status, error_message, sent_at
ALTER TABLE email_logs ADD COLUMN template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'sent';
ALTER TABLE email_logs ADD COLUMN error_message TEXT;
ALTER TABLE email_logs ADD COLUMN sent_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX email_logs_template_idx ON email_logs(template_id);
CREATE INDEX email_logs_status_idx ON email_logs(status);

-- 5. Create notification_rules table
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  send_in_app BOOLEAN NOT NULL DEFAULT true,
  send_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX notification_rules_event_type_idx ON notification_rules(event_type);
