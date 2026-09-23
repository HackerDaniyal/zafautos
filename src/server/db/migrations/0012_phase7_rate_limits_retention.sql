-- Phase 7: Rate limiter stale-row retention

-- Background:
--   enforceRateLimit() only ever upserts rows for the *current* window
--   (window_start = floor(now / windowMs) * windowMs). Once now passes a row's
--   expires_at, no future request can compute that window_start again, so the
--   row is unreachable and safe to delete. Application-side cleanup
--   (cleanupExpiredRateLimits) deletes such rows only when
--   expires_at <= app_now - 1 hour (retention buffer covers clock skew and
--   in-flight requests at window boundaries), in bounded batches — it can
--   never touch an active window or race an upsert (disjoint row sets).

-- This index lets cleanup find expired rows without a sequential scan.
-- (0010's partial index only covers active rows: WHERE expires_at > NOW().)
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits (expires_at);
