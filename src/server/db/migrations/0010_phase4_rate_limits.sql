-- Phase 4: Rate Limiting Infrastructure

-- 1. Create rate_limits table for distributed rate limiting via PostgreSQL
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    route_key VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Unique constraint on (identifier, route_key, window_start) to prevent
--    read-modify-write race conditions and enable atomic upsert via INSERT ... ON CONFLICT DO UPDATE
ALTER TABLE rate_limits ADD CONSTRAINT rate_limits_identifier_route_window_unique
    UNIQUE (identifier, route_key, window_start);

-- 3. Composite index for efficient rate limit lookups by identifier and route_key
CREATE INDEX IF NOT EXISTS rate_limits_identifier_route_idx ON rate_limits (identifier, route_key);

-- 4. Partial index for active windows (only unexpired entries)
CREATE INDEX IF NOT EXISTS rate_limits_active_idx ON rate_limits (identifier, route_key) WHERE expires_at > NOW();
