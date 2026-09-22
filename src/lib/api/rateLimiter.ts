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
