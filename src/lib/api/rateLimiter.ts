import { db } from '@/server/db/client';
import { rateLimits } from '@/server/db/schema';
import { DomainError } from '@/server/services/errors';
import { eq, and, sql } from 'drizzle-orm';

export class RateLimitExceededError extends DomainError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitExceededError';
  }
}

/**
 * How long expired rate-limit rows are retained before cleanup.
 *
 * Safety invariant: a row is only ever read via upsert against the *current*
 * window (window_start = floor(now / windowMs) * windowMs). Once now passes
 * expires_at, no future request can compute that window_start again, so the
 * row is unreachable. The 1-hour buffer additionally covers clock skew between
 * app/DB and requests in flight at a window boundary. Cleanup therefore can
 * never interfere with an active window or race an upsert (they target
 * disjoint rows: active windows have expires_at in the future).
 */
export const RATE_LIMIT_RETENTION_MS = 60 * 60 * 1000; // 1 hour past expiry

/** Max rows deleted per cleanup invocation — bounds lock time per statement. */
export const RATE_LIMIT_CLEANUP_BATCH_SIZE = 1000;

/** Probability that a successful enforcement triggers opportunistic cleanup. */
export const RATE_LIMIT_CLEANUP_PROBABILITY = 0.01;

function getWindowStart(windowMs: number): Date {
  const now = new Date();
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  return new Date(windowStartMs);
}

export async function enforceRateLimit(
  routeKey: string,
  requestIdentifier: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const windowStart = getWindowStart(windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs);

  try {
    const result = await db
      .insert(rateLimits)
      .values({
        identifier: requestIdentifier,
        routeKey,
        requestCount: 1,
        windowStart,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [rateLimits.identifier, rateLimits.routeKey, rateLimits.windowStart],
        set: {
          requestCount: sql`${rateLimits.requestCount} + 1`,
        },
      })
      .returning();

    if (result.length > 0 && result[0]!.requestCount > limit) {
      throw new RateLimitExceededError(
        `Rate limit exceeded for ${routeKey}: ${result[0]!.requestCount}/${limit}`
      );
    }
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      throw err;
    }
    // Fail-open: allow the request if the database is unavailable
    return;
  }

  // Opportunistic stale-row cleanup on the success path only. Best-effort:
  // a cleanup failure must never affect request handling (enforce already succeeded).
  if (Math.random() < RATE_LIMIT_CLEANUP_PROBABILITY) {
    try {
      await cleanupExpiredRateLimits();
    } catch {
      // ignored — retried on a later request
    }
  }
}

/**
 * Deletes rate-limit rows whose window expired more than the retention buffer
 * ago, in bounded batches. Safe to call from cron or opportunistically from
 * enforceRateLimit; only ever touches rows that are provably unreachable.
 * Throws on database error so explicit callers (e.g. cron) can observe it.
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const threshold = new Date(Date.now() - RATE_LIMIT_RETENTION_MS);
  await db.execute(sql`
    DELETE FROM rate_limits
    WHERE id IN (
      SELECT id FROM rate_limits
      WHERE expires_at <= ${threshold}
      ORDER BY expires_at
      LIMIT ${RATE_LIMIT_CLEANUP_BATCH_SIZE}
    )
  `);
}

export function getRateLimitIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export function getRateLimitIdentifierAuthenticated(userId: string): string {
  return `user:${userId}`;
}

/**
 * Client identifier for server actions (no Request object available there).
 *
 * Returns the first x-forwarded-for hop, or null when no trusted client IP is
 * present. Callers MUST skip enforcement when null instead of falling back to
 * a shared bucket — a shared 'unknown' bucket would let one header-less caller
 * exhaust the limit for everyone else (fail-open, consistent with DB failures).
 */
export async function getServerActionRateLimitIdentifier(): Promise<string | null> {
  try {
    const { headers } = await import('next/headers');
    const headerStore = await headers();
    const forwarded = headerStore.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Shared per-user limit for all file-upload server actions
 * (vehicle images/documents, order documents, admin documents, CMS media).
 * Counts upload action calls — not individual files inside a batch.
 */
export async function enforceFileUploadRateLimit(userId: string): Promise<void> {
  await enforceRateLimit(
    'file-uploads',
    getRateLimitIdentifierAuthenticated(userId),
    60,
    15 * 60 * 1000
  );
}
