import { db } from '@/server/db/client';
import { rateLimits } from '@/server/db/schema';
import { DomainError } from '@/server/services/errors';
import { eq, and, sql } from 'drizzle-orm';
import { isIP } from 'node:net';

/** Generic 429 text — never expose routeKey/count/limit (calibration info). */
const RATE_LIMIT_MESSAGE = 'Too many requests. Please try again later.';

export class RateLimitExceededError extends DomainError {
  /** Which limiter fired — internal logging only; not serialized to clients. */
  readonly routeKey: string;
  /** Seconds until the current window expires; drives the Retry-After header. */
  readonly retryAfterSeconds?: number;

  constructor(routeKey = '', retryAfterSeconds?: number) {
    super(RATE_LIMIT_MESSAGE, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitExceededError';
    this.routeKey = routeKey;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Hard cap applied to every identifier BEFORE any database round-trip.
 * Matches the rate_limits.identifier column (varchar(255)), so a malformed or
 * oversized client-supplied value can never trigger Postgres error 22001
 * (and thus can never slip past the Fail-open catch below as a bypass).
 */
export const MAX_IDENTIFIER_LENGTH = 255;

/** Longest valid textual IP address (IPv4-mapped IPv6); anything longer is invalid. */
const MAX_IP_LENGTH = 45;

/**
 * Trusted proxy-chain headers in preference order. Deployment topology:
 * Client → Cloudflare → Vercel → Next.js (see getTrustedClientIp).
 */
const TRUSTED_IP_HEADERS = ['cf-connecting-ip', 'x-real-ip', 'x-vercel-forwarded-for'] as const;

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
  requestIdentifier: string | null,
  limit: number,
  windowMs: number
): Promise<void> {
  // Deliberate fail-open on missing/invalid identity (distinct from the
  // database Fail-open below):
  //   - null → no trusted client IP and no authenticated id. Skip enforcement
  //     instead of collapsing unrelated callers into one shared 'unknown'
  //     bucket (a single anonymous client could otherwise exhaust it for
  //     everyone else — collateral DoS).
  //   - oversized (> varchar(255)) → skip BEFORE the DB round-trip so a
  //     malformed header can never produce Postgres error 22001 and thereby
  //     bypass the limiter through the Fail-open catch.
  if (!requestIdentifier || requestIdentifier.length > MAX_IDENTIFIER_LENGTH) {
    return;
  }

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
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
      );
      throw new RateLimitExceededError(routeKey, retryAfterSeconds);
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

/**
 * Canonical client-IP trust model (Cloudflare → Vercel → Next.js):
 *
 *   1. cf-connecting-ip        — rewritten by Cloudflare at its edge
 *   2. x-real-ip               — set by Vercel's edge
 *   3. x-vercel-forwarded-for  — set by Vercel's edge
 *
 * X-Forwarded-For is deliberately NEVER read: its leftmost entries are
 * client-supplied, so any caller could mint a fresh bucket per request
 * (leftmost-hop spoofing). For comma-separated trusted values only the
 * rightmost hop is considered — the one appended by the proxy closest to us.
 *
 * Every candidate must survive normalizeClientIp(): trimmed, length-capped at
 * 45 chars (well under the varchar(255) identifier limit) and validated with
 * net.isIP(). Arbitrary strings, empty values, control characters, header
 * chains and malformed addresses are rejected instead of reaching Postgres.
 *
 * Returns null when no trusted IP exists — callers treat null as
 * "no identity → skip enforcement" rather than a shared bucket.
 */
export function getTrustedClientIp(headers: {
  get(name: string): string | null;
}): string | null {
  for (const name of TRUSTED_IP_HEADERS) {
    const raw = headers.get(name);
    if (!raw) continue;
    const rightmost = raw.slice(raw.lastIndexOf(',') + 1).trim();
    const ip = normalizeClientIp(rightmost);
    if (ip) return ip;
  }
  return null;
}

/** Validates a single IP literal; rejects anything net.isIP() refuses or that is too long. */
export function normalizeClientIp(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim();
  if (candidate.length === 0 || candidate.length > MAX_IP_LENGTH) return null;
  if (isIP(candidate) === 0) return null;
  return candidate;
}

export function getRateLimitIdentifier(request: Request): string | null {
  return getTrustedClientIp(request.headers);
}

export function getRateLimitIdentifierAuthenticated(userId: string): string {
  return `user:${userId}`;
}

/**
 * Client identifier for server actions (no Request object available there).
 *
 * Uses the same trusted-header model as getRateLimitIdentifier — X-Forwarded-For
 * is never consulted — and returns null when no trusted client IP is present.
 * Callers MUST skip enforcement when null instead of falling back to a shared
 * bucket: a shared bucket would let one header-less caller exhaust the limit
 * for everyone else (fail-open, consistent with DB failures). Note that server
 * actions return a fixed ActionResult shape, so a rate-limit rejection there is
 * surfaced as { success: false } with the fixed message and carries no
 * Retry-After header; Retry-After is applied on API-route 429s where the
 * response contract allows it.
 */
export async function getServerActionRateLimitIdentifier(): Promise<string | null> {
  try {
    const { headers } = await import('next/headers');
    const headerStore = await headers();
    return getTrustedClientIp(headerStore);
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
