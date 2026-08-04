import { z } from 'zod';
import { DomainError } from '@/server/services/errors';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ActionError = { success: false; error: string; code?: string };

/**
 * Shared error handler for server actions.
 * Handles ZodError, DomainError, and generic Error uniformly.
 */
export function handleError(error: unknown): ActionError {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }
  if (error instanceof DomainError) {
    return { success: false, error: error.message, code: error.code };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}
