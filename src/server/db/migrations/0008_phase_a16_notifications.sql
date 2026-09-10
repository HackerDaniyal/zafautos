-- Phase A.16: Notifications, Alerts & Event Automation

-- 1. Create notification_category_enum
CREATE TYPE notification_category_enum AS ENUM (
  'order', 'payment', 'shipping', 'support', 'lead', 'vehicle', 'system'
);

-- 2. Enhance notifications table with new columns
ALTER TABLE notifications ADD COLUMN type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN category notification_category_enum;
ALTER TABLE notifications ADD COLUMN link TEXT;
ALTER TABLE notifications ADD COLUMN metadata JSONB;
ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN event_key VARCHAR(255);

-- Backfill existing notifications with category='system'
UPDATE notifications SET category = 'system', type = 'system.message' WHERE category IS NULL;

-- Make category NOT NULL after backfill
ALTER TABLE notifications ALTER COLUMN category SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;

-- Add indexes for new columns
CREATE INDEX notifications_type_idx ON notifications(type);
CREATE INDEX notifications_category_idx ON notifications(category);
CREATE INDEX notifications_event_key_idx ON notifications(event_key);
CREATE INDEX notifications_read_at_idx ON notifications(read_at);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);

-- Add unique constraint for deduplication (event_key must be unique when set)
CREATE UNIQUE INDEX notifications_event_key_unique_idx ON notifications(event_key) WHERE event_key IS NOT NULL;

-- 3. Create notification_preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category notification_category_enum NOT NULL,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

CREATE INDEX notification_preferences_user_idx ON notification_preferences(user_id);

-- 4. Extend notification_rules with category for grouping
ALTER TABLE notification_rules ADD COLUMN category notification_category_enum;
UPDATE notification_rules SET category = 'order' WHERE event_type LIKE 'order.%';
UPDATE notification_rules SET category = 'payment' WHERE event_type LIKE 'payment.%';
UPDATE notification_rules SET category = 'shipping' WHERE event_type LIKE 'shipping.%';
UPDATE notification_rules SET category = 'lead' WHERE event_type LIKE 'enquiry.%';
UPDATE notification_rules SET category = 'system' WHERE event_type LIKE 'user.%';
ALTER TABLE notification_rules ALTER COLUMN category SET NOT NULL;
