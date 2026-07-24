-- Add user_status_enum and status column to users table
-- Run this migration in Supabase SQL Editor

-- Create the enum type
DO $$ BEGIN
  CREATE TYPE user_status_enum AS ENUM ('active', 'pending', 'suspended', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column with default 'active' for existing users
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status_enum DEFAULT 'active' NOT NULL;

-- Add index for status lookups
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

-- Update RLS policies to check status
-- Suspended/blocked users should not be able to access the app via RLS
-- (This is a defense-in-depth; the middleware handles the primary check)
