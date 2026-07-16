import { DomainError } from '@/server/services/errors';

export class RateLimitExceededError extends DomainError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitExceededError';
  }
}

/**
 * TODO: Implement Redis-based rate limiting (Phase 5 or later)
 * Placeholder for rate limiting middleware hook.
 */
export async function enforceRateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number
): Promise<void> {
  // Pass-through for now, properly consuming parameters for ESLint
  void identifier;
  void limit;
  void windowMs;
  return Promise.resolve();
}
